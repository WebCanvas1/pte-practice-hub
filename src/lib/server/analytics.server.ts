import type { TestAttemptRecord } from "@/config/tests";
import type {
  ProgressData,
  ResultAnalysis,
  MetricRow,
  RecommendationData,
  AdminAnalytics,
} from "@/lib/analytics-types";
import type { AttemptQuestionRecord, StoredAnswer } from "./tests.server";
import type { D1Database, WorkerEnv } from "./bindings.server";
import type { AttemptScoreResult, QuestionScore } from "./scoring/types";
import { newId } from "./crypto.server";

const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const label = (key: string) => key.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const metricRows = <T extends QuestionScore>(scores: T[], key: (s: T) => string): MetricRow[] => {
  const groups = new Map<string, T[]>();
  for (const score of scores) groups.set(key(score), [...(groups.get(key(score)) ?? []), score]);
  return [...groups]
    .map(([name, rows]) => {
      const max = rows.reduce((sum, row) => sum + row.maximum, 0);
      return {
        label: label(name),
        score: max ? round((rows.reduce((sum, row) => sum + row.earned, 0) / max) * 100) : 0,
        attempts: rows.length,
      };
    })
    .sort((a, b) => b.score - a.score);
};

export function buildResultAnalysis(
  attempt: TestAttemptRecord,
  questions: AttemptQuestionRecord[],
  answers: StoredAnswer[],
  result: AttemptScoreResult,
  previousPercentage: number | null,
): ResultAnalysis {
  const difficulty = new Map(questions.map((q) => [q.id, q.difficulty]));
  const enriched = result.questions.map((q) => ({
    ...q,
    difficulty: difficulty.get(q.attemptQuestionId) ?? attempt.difficulty,
  }));
  const byQuestionType = metricRows(enriched, (q) => q.typeKey);
  const byDifficulty = metricRows(enriched, (q) => q.difficulty);
  const bySkill = metricRows(enriched, (q) => q.module);
  const times = new Map(answers.map((a) => [a.attemptQuestionId, a.timeSpentSeconds]));
  const timeIssues = questions
    .filter((q) => (times.get(q.id) ?? 0) > q.estimatedSeconds * 1.35)
    .slice(0, 3)
    .map((q) => `${label(q.typeKey)} took longer than its suggested time.`);
  const weakest = byQuestionType.at(-1);
  const strongest = byQuestionType[0];
  const wrong = result.questions.filter((q) => q.outcome === "incorrect");
  const commonMistakes = metricRows(wrong, (q) => q.typeKey)
    .slice(0, 3)
    .map((row) => `Low accuracy in ${row.label}.`);
  const weakestModule = bySkill.at(-1)?.label ?? label(attempt.module ?? "mixed");
  const nextDifficulty =
    result.overall.percentage >= 75
      ? "Hard"
      : result.overall.percentage >= 55
        ? "Intermediate"
        : "Easy";
  return {
    testName: attempt.templateName,
    completionDate: attempt.completedAt ?? attempt.submittedAt ?? result.scoredAt,
    module: attempt.module ? label(attempt.module) : "All modules",
    difficulty: label(attempt.difficulty),
    estimatedScore: Math.round(result.overall.percentage * 0.9),
    percentage: result.overall.percentage,
    timeTakenSeconds: answers.reduce((sum, answer) => sum + answer.timeSpentSeconds, 0),
    attempted: result.questions.filter((q) => q.answered).length,
    correct: result.questions.filter((q) => q.outcome === "correct").length,
    partial: result.questions.filter((q) => q.outcome === "partial").length,
    incorrect: result.questions.filter((q) => q.outcome === "incorrect").length,
    aiStatus: result.status === "completed" ? "Complete" : "Processing",
    byQuestionType,
    byDifficulty,
    bySkill,
    strongestType: strongest?.label ?? "Not enough data",
    weakestType: weakest?.label ?? "Not enough data",
    commonMistakes: commonMistakes.length ? commonMistakes : ["No repeated mistake pattern yet."],
    timeIssues: timeIssues.length ? timeIssues : ["No significant time-management issue detected."],
    improvement:
      previousPercentage === null ? null : round(result.overall.percentage - previousPercentage),
    nextModule: weakestModule,
    nextDifficulty,
    priorities: [
      `Practise ${weakest?.label ?? "your lowest-scoring task"}.`,
      timeIssues[0] ?? "Maintain consistent pacing under timed conditions.",
      `Complete a ${nextDifficulty} ${weakestModule} practice set.`,
    ],
  };
}

interface ResultRow {
  id: string;
  template_name: string;
  module_key: string | null;
  difficulty: string;
  completed_at: string | null;
  submitted_at: string | null;
  result_json: string;
}
async function userResults(
  DB: D1Database | undefined,
  userId: string,
): Promise<Array<ResultRow & { result: AttemptScoreResult }>> {
  if (!DB) return [];
  const rows = await DB.prepare(
    `SELECT ta.id, ta.template_name, ta.module_key, ta.difficulty, ta.completed_at, ta.submitted_at, r.result_json FROM test_attempts ta JOIN attempt_scoring_results r ON r.attempt_id=ta.id WHERE ta.user_id=? ORDER BY COALESCE(ta.completed_at, ta.submitted_at) ASC`,
  )
    .bind(userId)
    .all<ResultRow>();
  return rows.results.map((row) => ({
    ...row,
    result: JSON.parse(row.result_json) as AttemptScoreResult,
  }));
}

export async function loadProgress(
  DB: D1Database | undefined,
  userId: string,
): Promise<ProgressData> {
  const rows = await userResults(DB, userId);
  const questions = rows.flatMap((row) => row.result.questions);
  const trend = rows.map((row) => ({
    label: new Date(row.completed_at ?? row.submitted_at ?? "").toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
    }),
    score: Math.round(row.result.overall.percentage * 0.9),
  }));
  const dates = new Set(
    rows.map((row) => (row.completed_at ?? row.submitted_at ?? "").slice(0, 10)),
  );
  let streak = 0;
  const cursor = new Date();
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  const timeRows = DB
    ? await DB.prepare(
        `SELECT AVG(sa.time_spent_seconds) average FROM student_answers sa JOIN test_attempts ta ON ta.id=sa.attempt_id WHERE ta.user_id=? AND ta.status='completed'`,
      )
        .bind(userId)
        .first<{ average: number | null }>()
    : null;
  const questionTypes = metricRows(questions, (q) => q.typeKey);
  return {
    trend,
    modules: metricRows(questions, (q) => q.module),
    questionTypes,
    difficulties: metricRows(
      rows.flatMap((row) => row.result.questions.map((q) => ({ ...q, typeKey: row.difficulty }))),
      (q) => q.typeKey,
    ),
    averageCompletionSeconds: round(timeRows?.average ?? 0),
    completedTests: rows.length,
    streak,
    firstScore: trend[0]?.score ?? 0,
    latestScore: trend.at(-1)?.score ?? 0,
    recent: rows
      .slice(-5)
      .reverse()
      .map((row) => ({
        id: row.id,
        name: row.template_name,
        date: row.completed_at ?? row.submitted_at ?? "",
        score: Math.round(row.result.overall.percentage * 0.9),
      })),
    weakTrends: [...questionTypes].sort((a, b) => a.score - b.score).slice(0, 5),
  };
}

export async function persistProgressMetrics(
  DB: D1Database | undefined,
  userId: string,
  result: AttemptScoreResult,
  answers: StoredAnswer[],
): Promise<void> {
  if (!DB) return;
  const capturedAt = new Date().toISOString();
  await DB.prepare(
    `INSERT INTO progress_snapshots (id,user_id,attempt_id,estimated_score,percentage,module_scores_json,metrics_json,captured_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(attempt_id) DO UPDATE SET estimated_score=excluded.estimated_score,percentage=excluded.percentage,module_scores_json=excluded.module_scores_json,metrics_json=excluded.metrics_json,captured_at=excluded.captured_at`,
  )
    .bind(
      newId("snap"),
      userId,
      result.attemptId,
      round(result.overall.percentage * 0.9),
      result.overall.percentage,
      JSON.stringify(result.modules),
      JSON.stringify({ questions: result.questions.length, status: result.status }),
      capturedAt,
    )
    .run();
  const times = new Map(answers.map((a) => [a.attemptQuestionId, a.timeSpentSeconds]));
  for (const row of metricRows(result.questions, (q) => q.typeKey)) {
    const source = result.questions.filter((q) => label(q.typeKey) === row.label);
    const earned = source.reduce((sum, q) => sum + q.earned, 0);
    const maximum = source.reduce((sum, q) => sum + q.maximum, 0);
    const average = source.length
      ? source.reduce((sum, q) => sum + (times.get(q.attemptQuestionId) ?? 0), 0) / source.length
      : 0;
    const module = source[0]?.module ?? "reading";
    await DB.prepare(
      `INSERT INTO student_skill_metrics (id,user_id,skill_key,module_key,attempts,earned,maximum,accuracy,average_seconds,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,skill_key) DO UPDATE SET attempts=student_skill_metrics.attempts+excluded.attempts,earned=student_skill_metrics.earned+excluded.earned,maximum=student_skill_metrics.maximum+excluded.maximum,accuracy=(student_skill_metrics.earned+excluded.earned)*100/NULLIF(student_skill_metrics.maximum+excluded.maximum,0),average_seconds=(student_skill_metrics.average_seconds+excluded.average_seconds)/2,updated_at=excluded.updated_at`,
    )
      .bind(
        newId("skill"),
        userId,
        source[0]?.typeKey ?? row.label,
        module,
        source.length,
        earned,
        maximum,
        row.score,
        round(average),
        capturedAt,
      )
      .run();
  }
}

export async function recommendations(env: WorkerEnv, userId: string): Promise<RecommendationData> {
  const progress = await loadProgress(env.DB, userId);
  const best = [...progress.questionTypes].sort((a, b) => b.score - a.score).slice(0, 3);
  const weak = [...progress.questionTypes].sort((a, b) => a.score - b.score).slice(0, 3);
  const strengths = best.map((x) => `${x.label} (${x.score}%)`);
  const weaknesses = weak.map((x) => `${x.label} (${x.score}%)`);
  const next = weak[0]?.label ?? "Foundational mixed practice";
  const verified = {
    completedTests: progress.completedTests,
    firstScore: progress.firstScore,
    latestScore: progress.latestScore,
    strengths,
    weaknesses,
  };
  let narrative = progress.completedTests
    ? `Your current priority is ${next}. Complete two focused practice sets before your next full test.`
    : "Complete your first scored test to unlock personalised recommendations.";
  if (env.AI && progress.completedTests) {
    try {
      const response = await env.AI.run(
        env.AI_WRITING_MODEL ?? "@cf/meta/llama-3.1-8b-instruct-fast",
        {
          messages: [
            {
              role: "system",
              content:
                "Turn the verified JSON metrics into one concise PTE practice recommendation. Never add scores, attempts, trends or facts not present in the JSON.",
            },
            { role: "user", content: JSON.stringify(verified) },
          ],
          max_tokens: 180,
          temperature: 0.1,
        },
      );
      if (
        response &&
        typeof response === "object" &&
        "response" in response &&
        typeof response.response === "string"
      )
        narrative = response.response.trim();
    } catch {
      /* deterministic recommendation remains authoritative */
    }
  }
  const plan = Array.from({ length: 7 }, (_, index) => ({
    day: index + 1,
    focus: weak[index % Math.max(weak.length, 1)]?.label ?? "Core skills",
    activity: index === 6 ? "Timed review and reflection" : "20–30 minutes of targeted practice",
  }));
  const history: RecommendationData["history"] = [];
  if (env.DB) {
    const now = new Date().toISOString();
    const id = newId("rec");
    await env.DB.prepare(
      `INSERT INTO student_recommendations (id,user_id,metrics_json,recommendation_json,provider,model,created_at) VALUES (?,?,?,?,?,?,?)`,
    )
      .bind(
        id,
        userId,
        JSON.stringify(verified),
        JSON.stringify({ narrative, strengths, weaknesses, plan }),
        env.AI ? "cloudflare-workers-ai" : "deterministic",
        env.AI_WRITING_MODEL ?? null,
        now,
      )
      .run();
    await env.DB.prepare(
      `INSERT INTO study_plans (id,user_id,recommendation_id,plan_json,starts_on,status,created_at) VALUES (?,?,?,?,?,'active',?)`,
    )
      .bind(newId("plan"), userId, id, JSON.stringify(plan), now.slice(0, 10), now)
      .run();
    const prior = await env.DB.prepare(
      `SELECT id,recommendation_json,created_at FROM student_recommendations WHERE user_id=? ORDER BY created_at DESC LIMIT 5`,
    )
      .bind(userId)
      .all<{ id: string; recommendation_json: string; created_at: string }>();
    history.push(
      ...prior.results.map((row) => ({
        id: row.id,
        narrative: (JSON.parse(row.recommendation_json) as { narrative: string }).narrative,
        createdAt: row.created_at,
      })),
    );
  }
  return {
    strengths,
    weaknesses,
    priorityTypes: weak.map((x) => x.label),
    nextTest: `${progress.latestScore >= 68 ? "Intermediate" : "Easy"} ${next} practice`,
    frequency: "Four focused sessions per week",
    plan,
    narrative,
    history,
  };
}

export async function adminAnalytics(DB: D1Database | undefined): Promise<AdminAnalytics> {
  if (!DB)
    return {
      activeStudents: 0,
      registeredStudents: 0,
      testsPurchased: 0,
      testsCompleted: 0,
      completionRate: 0,
      averageScore: 0,
      aiFailures: 0,
      revenue: 0,
      currency: "AUD",
      modules: [],
      difficulties: [],
      weakestTypes: [],
    };
  const scalar = async (sql: string) =>
    (await DB.prepare(sql).first<{ value: number }>())?.value ?? 0;
  const [
    registeredStudents,
    activeStudents,
    testsPurchased,
    testsCompleted,
    averageScore,
    aiFailures,
    revenue,
  ] = await Promise.all([
    scalar(
      `SELECT COUNT(*) value FROM users u JOIN user_roles ur ON ur.user_id=u.id WHERE ur.role_key='student'`,
    ),
    scalar(
      `SELECT COUNT(DISTINCT user_id) value FROM test_attempts WHERE created_at>=datetime('now','-30 days')`,
    ),
    scalar(`SELECT COUNT(*) value FROM test_entitlements`),
    scalar(`SELECT COUNT(*) value FROM test_attempts WHERE status='completed'`),
    scalar(`SELECT COALESCE(AVG(total_score),0) value FROM test_attempts WHERE status='completed'`),
    scalar(`SELECT COUNT(*) value FROM ai_evaluation_jobs WHERE status='failed'`),
    scalar(
      `SELECT COALESCE(SUM(price_paid),0) value FROM test_entitlements WHERE status!='refunded'`,
    ),
  ]);
  const group = async (field: string, table = "test_attempts") =>
    (
      await DB.prepare(
        `SELECT COALESCE(${field},'Mixed') label, COUNT(*) attempts, COUNT(*) score FROM ${table} GROUP BY ${field} ORDER BY attempts DESC`,
      ).all<MetricRow>()
    ).results;
  const weak = (
    await DB.prepare(
      `SELECT type_key label, COUNT(*) attempts, COALESCE(AVG(score_percentage),0) score FROM attempt_question_scores GROUP BY type_key ORDER BY score ASC LIMIT 8`,
    ).all<MetricRow>()
  ).results;
  return {
    activeStudents,
    registeredStudents,
    testsPurchased,
    testsCompleted,
    completionRate: testsPurchased ? round((testsCompleted / testsPurchased) * 100) : 0,
    averageScore: round(averageScore),
    aiFailures,
    revenue,
    currency: "AUD",
    modules: await group("module_key"),
    difficulties: await group("difficulty"),
    weakestTypes: weak,
  };
}

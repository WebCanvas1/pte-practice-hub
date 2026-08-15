import type { D1Database } from "../bindings.server";
import type { AttemptScoreResult } from "./types";

const memoryResults = new Map<string, AttemptScoreResult>();

export async function loadScoreResult(
  DB: D1Database | undefined,
  attemptId: string,
): Promise<AttemptScoreResult | null> {
  if (!DB) return memoryResults.get(attemptId) ?? null;
  const row = await DB.prepare(
    `SELECT result_json FROM attempt_scoring_results WHERE attempt_id = ?`,
  )
    .bind(attemptId)
    .first<{ result_json: string }>();
  return row ? (JSON.parse(row.result_json) as AttemptScoreResult) : null;
}

export async function persistScoreResult(
  DB: D1Database | undefined,
  result: AttemptScoreResult,
): Promise<void> {
  if (!DB) {
    memoryResults.set(result.attemptId, result);
    return;
  }
  for (const score of result.questions) {
    await DB.prepare(
      `INSERT INTO attempt_question_scores
       (attempt_id, attempt_question_id, question_id, module_key, type_key, raw_score, max_score,
        score_percentage, scoring_method, scoring_status, answered, outcome, student_response,
        correct_answer, score_breakdown, scored_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(attempt_question_id) DO UPDATE SET raw_score=excluded.raw_score,
       max_score=excluded.max_score, score_percentage=excluded.score_percentage,
       scoring_method=excluded.scoring_method, scoring_status=excluded.scoring_status,
       answered=excluded.answered, outcome=excluded.outcome, student_response=excluded.student_response,
       correct_answer=excluded.correct_answer, score_breakdown=excluded.score_breakdown, scored_at=excluded.scored_at`,
    )
      .bind(
        result.attemptId,
        score.attemptQuestionId,
        score.questionId,
        score.module,
        score.typeKey,
        score.earned,
        score.maximum,
        score.percentage,
        score.method,
        score.status,
        score.answered ? 1 : 0,
        score.outcome,
        JSON.stringify(score.studentResponse),
        JSON.stringify(score.correctAnswer),
        JSON.stringify(score.breakdown),
        result.scoredAt,
      )
      .run();
    await DB.prepare(
      `UPDATE student_answers SET score = ?, max_score = ?, score_breakdown = ? WHERE attempt_question_id = ?`,
    )
      .bind(score.earned, score.maximum, JSON.stringify(score.breakdown), score.attemptQuestionId)
      .run();
  }
  await DB.prepare(
    `INSERT INTO attempt_scoring_results (attempt_id, scoring_status, raw_score, max_score, score_percentage, result_json, scored_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(attempt_id) DO UPDATE SET scoring_status=excluded.scoring_status, raw_score=excluded.raw_score,
     max_score=excluded.max_score, score_percentage=excluded.score_percentage, result_json=excluded.result_json,
     scored_at=excluded.scored_at`,
  )
    .bind(
      result.attemptId,
      result.status,
      result.overall.earned,
      result.overall.maximum,
      result.overall.percentage,
      JSON.stringify(result),
      result.scoredAt,
    )
    .run();
  await DB.prepare(`UPDATE test_attempts SET total_score = ? WHERE id = ?`)
    .bind(result.overall.percentage, result.attemptId)
    .run();
}

export async function clearScoreResult(
  DB: D1Database | undefined,
  attemptId: string,
): Promise<void> {
  memoryResults.delete(attemptId);
  if (!DB) return;
  await DB.prepare(`DELETE FROM ai_evaluation_jobs WHERE attempt_id = ?`)
    .bind(attemptId)
    .run();
  await DB.prepare(`DELETE FROM attempt_question_scores WHERE attempt_id = ?`)
    .bind(attemptId)
    .run();
  await DB.prepare(`DELETE FROM attempt_scoring_results WHERE attempt_id = ?`)
    .bind(attemptId)
    .run();
}

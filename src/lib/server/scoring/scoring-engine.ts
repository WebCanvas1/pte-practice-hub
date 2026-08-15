import type { ModuleKey } from "@/config/questions";
import { emptyAnswer } from "@/config/test-runner";
import { scoreQuestion } from "./question-scorers";
import type { AttemptScoreResult, ScoreAggregate, ScoreableQuestion, ScoringAnswer } from "./types";

const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const aggregate = (earned: number, maximum: number): ScoreAggregate => ({
  earned,
  maximum,
  percentage: maximum > 0 ? round((earned / maximum) * 100) : 0,
});

export function scoreAttempt(
  attemptId: string,
  questions: ScoreableQuestion[],
  answers: Map<string, ScoringAnswer>,
  scoredAt = new Date().toISOString(),
): AttemptScoreResult {
  const scores = questions.map((row) => {
    const answer = answers.get(row.id) ?? { text: "", data: emptyAnswer() };
    const raw = scoreQuestion(row.snapshot, answer);
    const answered = Boolean(
      answer.text.trim() ||
      answer.data.selections.length ||
      Object.values(answer.data.blanks).some(Boolean) ||
      answer.data.ordering.length ||
      answer.data.highlighted.length ||
      answer.audioKey,
    );
    const percentage = raw.maximum > 0 ? round((raw.earned / raw.maximum) * 100) : null;
    return {
      attemptQuestionId: row.id,
      questionId: row.questionId,
      module: row.module,
      typeKey: row.typeKey,
      method: raw.method,
      status: raw.status,
      answered,
      earned: raw.earned,
      maximum: raw.maximum,
      percentage,
      outcome:
        raw.status === "pending_ai"
          ? ("pending_ai" as const)
          : raw.earned === raw.maximum && raw.maximum > 0
            ? ("correct" as const)
            : raw.earned > 0
              ? ("partial" as const)
              : ("incorrect" as const),
      studentResponse: { text: answer.text, data: answer.data },
      correctAnswer: raw.correctAnswer,
      breakdown: raw.breakdown,
    };
  });

  const modules: AttemptScoreResult["modules"] = {};
  for (const module of ["speaking", "writing", "reading", "listening"] as ModuleKey[]) {
    const relevant = scores.filter((score) => score.module === module);
    if (!relevant.length) continue;
    const scored = relevant.filter((score) => score.status === "scored");
    const value = aggregate(
      scored.reduce((sum, score) => sum + score.earned, 0),
      scored.reduce((sum, score) => sum + score.maximum, 0),
    );
    modules[module] = relevant.some((score) => score.status === "pending_ai")
      ? { ...value, status: "pending_ai" }
      : value;
  }
  const deterministic = scores.filter((score) => score.status === "scored");
  const overall = aggregate(
    deterministic.reduce((sum, score) => sum + score.earned, 0),
    deterministic.reduce((sum, score) => sum + score.maximum, 0),
  );
  return {
    attemptId,
    status: scores.some((score) => score.status === "pending_ai") ? "pending_ai" : "completed",
    overall,
    modules,
    questions: scores,
    scoredAt,
  };
}

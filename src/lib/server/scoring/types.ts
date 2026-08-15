import type { ModuleKey, QuestionRecord } from "@/config/questions";
import type { AnswerData } from "@/config/test-runner";

export type ScoringMethod =
  | "binary"
  | "multiple-choice-negative"
  | "blank-per-answer"
  | "adjacent-pairs"
  | "highlight-negative"
  | "word-match"
  | "ai";

export type ScoringStatus = "scored" | "pending_ai";

export interface ScoringAnswer {
  text: string;
  data: AnswerData;
  audioKey?: string | null;
}

export interface QuestionScore {
  attemptQuestionId: string;
  questionId: string;
  module: ModuleKey;
  typeKey: string;
  method: ScoringMethod;
  status: ScoringStatus;
  answered: boolean;
  earned: number;
  maximum: number;
  percentage: number | null;
  outcome: "correct" | "partial" | "incorrect" | "pending_ai";
  studentResponse: { text: string; data: AnswerData };
  correctAnswer: unknown;
  breakdown: Record<string, unknown>;
}

export interface ScoreableQuestion {
  id: string;
  questionId: string;
  module: ModuleKey;
  typeKey: string;
  snapshot: QuestionRecord;
}

export interface ScoreAggregate {
  earned: number;
  maximum: number;
  percentage: number;
}

export interface AttemptScoreResult {
  attemptId: string;
  status: "completed" | "pending_ai";
  overall: ScoreAggregate;
  modules: Partial<Record<ModuleKey, ScoreAggregate & { status?: "pending_ai" }>>;
  questions: QuestionScore[];
  scoredAt: string;
}

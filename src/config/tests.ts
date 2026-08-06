/**
 * Test template + attempt catalogue — shared by the admin template manager,
 * the student browse/my-tests screens and the Worker generation engine.
 *
 * Client-safe: no server imports. Prices/currency labels come from
 * src/config/site.ts so nothing is hardcoded twice.
 */
import { pricingConfig, type DifficultyKey, type ModuleKey } from "@/config/site";
import { moduleLabels, questionTypeMap, questionTypes } from "@/config/questions";

export const testTypes = ["module", "mock", "practice_set"] as const;
export type TestType = (typeof testTypes)[number];

export const testTypeLabels: Record<TestType, string> = {
  module: "Individual module test",
  mock: "Complete mock test",
  practice_set: "Practice set",
};

/** `mixed` only applies to complete mock tests. */
export const templateDifficulties = ["easy", "intermediate", "hard", "mixed"] as const;
export type TemplateDifficulty = (typeof templateDifficulties)[number];

export const templateDifficultyLabels: Record<TemplateDifficulty, string> = {
  easy: "Easy",
  intermediate: "Intermediate",
  hard: "Hard",
  mixed: "Mixed",
};

export const attemptStatuses = [
  "purchased",
  "ready",
  "in_progress",
  "paused",
  "submitted",
  "expired",
  "scoring",
  "completed",
  "cancelled",
] as const;
export type AttemptStatus = (typeof attemptStatuses)[number];

export const attemptStatusLabels: Record<AttemptStatus, string> = {
  purchased: "Purchased",
  ready: "Ready to start",
  in_progress: "In progress",
  paused: "Paused",
  submitted: "Awaiting scoring",
  expired: "Expired",
  scoring: "Scoring",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const attemptStatusVariant: Record<
  AttemptStatus,
  "secondary" | "warning" | "success" | "info" | "outline"
> = {
  purchased: "secondary",
  ready: "info",
  in_progress: "info",
  paused: "warning",
  submitted: "warning",
  expired: "secondary",
  scoring: "warning",
  completed: "success",
  cancelled: "outline",
};

/** Groups used by the student My Tests page. */
export const attemptGroups: { key: string; label: string; statuses: AttemptStatus[] }[] = [
  { key: "ready", label: "Ready to start", statuses: ["purchased", "ready"] },
  { key: "in_progress", label: "In progress", statuses: ["in_progress", "paused"] },
  { key: "awaiting", label: "Awaiting scoring", statuses: ["submitted", "scoring"] },
  { key: "completed", label: "Completed", statuses: ["completed"] },
  { key: "expired", label: "Expired", statuses: ["expired", "cancelled"] },
];

/* ------------------------------ record shapes ------------------------------ */

export interface TestTemplateRule {
  id?: string | undefined;
  typeKey: string;
  /** How many questions the generator must place from this task type. */
  questionCount: number;
  /** Optional per-rule override; falls back to the template difficulty. */
  difficulty?: DifficultyKey | undefined;
  position: number;
}

export interface TestTemplateRecord {
  id: string;
  name: string;
  description: string;
  testType: TestType;
  /** null for complete mock tests (all four modules). */
  module: ModuleKey | null;
  difficulty: TemplateDifficulty;
  price: number;
  currency: string;
  questionCount: number;
  timeLimitMinutes: number;
  targetScore: number | null;
  instructions: string;
  isActive: boolean;
  purchasable: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  rules: TestTemplateRule[];
}

export interface TemplateRuleAvailability {
  typeKey: string;
  typeName: string;
  module: ModuleKey;
  difficulty: DifficultyKey;
  required: number;
  available: number;
  shortfall: number;
}

export interface TemplateValidation {
  templateId: string;
  ok: boolean;
  requiredTotal: number;
  availableTotal: number;
  rules: TemplateRuleAvailability[];
  warnings: string[];
}

export interface AttemptQuestionSummary {
  id: string;
  position: number;
  questionId: string;
  questionVersion: number;
  module: ModuleKey;
  typeKey: string;
  typeName: string;
  difficulty: DifficultyKey;
  title: string;
  estimatedSeconds: number;
}

export interface TestAttemptRecord {
  id: string;
  templateId: string;
  templateName: string;
  templateVersion: number;
  userId: string;
  module: ModuleKey | null;
  testType: TestType;
  difficulty: TemplateDifficulty;
  status: AttemptStatus;
  questionCount: number;
  timeLimitMinutes: number;
  currentQuestion: number;
  answeredCount: number;
  totalScore: number | null;
  targetScore: number | null;
  entitlementId: string | null;
  createdAt: string;
  startedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  expiresAt: string | null;
  questions: AttemptQuestionSummary[];
}

export interface EntitlementRecord {
  id: string;
  userId: string;
  templateId: string;
  status: "active" | "used" | "expired" | "refunded";
  attemptId: string | null;
  source: string;
  createdAt: string;
  expiresAt: string | null;
}

/* ---------------------------- default templates ---------------------------- */

export interface DefaultTemplateDef {
  slug: string;
  name: string;
  description: string;
  testType: TestType;
  module: ModuleKey | null;
  difficulty: TemplateDifficulty;
  timeLimitMinutes: number;
  targetScore: number;
  instructions: string;
  /** typeKey → question count. */
  distribution: Record<string, number>;
}

/**
 * Module distributions. Speaking, Reading and Listening use ~30 questions.
 * Writing intentionally uses 3 real tasks (2 × Summarize Written Text +
 * 1 × Write Essay): a 30-response writing test is neither realistic nor
 * practical, so writing templates are configured separately.
 */
const moduleDistributions: Record<ModuleKey, Record<string, number>> = {
  speaking: {
    read_aloud: 6,
    repeat_sentence: 8,
    describe_image: 5,
    retell_lecture: 3,
    answer_short_question: 5,
    respond_to_situation: 2,
    summarize_group_discussion: 1,
  },
  reading: {
    reading_writing_fill_blanks: 8,
    reading_mcq_multiple: 5,
    reorder_paragraphs: 6,
    reading_fill_blanks: 7,
    reading_mcq_single: 4,
  },
  writing: {
    summarize_written_text: 2,
    write_essay: 1,
  },
  listening: {
    summarize_spoken_text: 2,
    listening_mcq_multiple: 4,
    listening_fill_blanks: 4,
    highlight_correct_summary: 4,
    listening_mcq_single: 4,
    select_missing_word: 4,
    highlight_incorrect_words: 4,
    write_from_dictation: 4,
  },
};

const moduleTimeLimits: Record<ModuleKey, number> = {
  speaking: 30,
  reading: 32,
  writing: 40,
  listening: 35,
};

const moduleBlurbs: Record<ModuleKey, string> = {
  speaking:
    "Thirty spoken tasks covering read aloud, repeat sentence, describe image, retell lecture and short answers.",
  reading:
    "Thirty reading tasks covering fill in the blanks, re-order paragraphs and multiple choice questions.",
  writing:
    "Three full writing tasks: two Summarize Written Text responses and one 200–300 word essay. Writing is deliberately configured with a practical task count rather than 30 responses.",
  listening:
    "Thirty listening tasks covering summarise spoken text, dictation, fill in the blanks and highlight incorrect words.",
};

const moduleTargets: Record<DifficultyKey, number> = { easy: 50, intermediate: 65, hard: 79 };

export const defaultTemplates: DefaultTemplateDef[] = [
  ...(["speaking", "reading", "writing", "listening"] as ModuleKey[]).flatMap((module) =>
    (["easy", "intermediate", "hard"] as DifficultyKey[]).map((difficulty) => ({
      slug: `${module}-${difficulty}`,
      name: `${moduleLabels[module]} — ${difficulty[0]!.toUpperCase()}${difficulty.slice(1)}`,
      description: moduleBlurbs[module],
      testType: "module" as TestType,
      module,
      difficulty: difficulty as TemplateDifficulty,
      timeLimitMinutes: moduleTimeLimits[module],
      targetScore: moduleTargets[difficulty],
      instructions:
        "Complete every task in order. Timing is per task where the PTE exam is timed per task; the overall limit applies to the whole test.",
      distribution: moduleDistributions[module],
    })),
  ),
  {
    slug: "full-mock-mixed",
    name: "Complete Mock Test — All Modules",
    description:
      "A full four-module mock test with mixed difficulty: Speaking, Reading, Writing and Listening in exam order.",
    testType: "mock",
    module: null,
    difficulty: "mixed",
    timeLimitMinutes: 137,
    targetScore: 65,
    instructions:
      "This mock test runs in exam order: Speaking, Writing, Reading and then Listening. Allow the full time in one sitting.",
    distribution: {
      read_aloud: 3,
      repeat_sentence: 4,
      describe_image: 2,
      retell_lecture: 1,
      answer_short_question: 2,
      summarize_written_text: 2,
      write_essay: 1,
      reading_writing_fill_blanks: 3,
      reading_mcq_multiple: 2,
      reorder_paragraphs: 2,
      reading_fill_blanks: 2,
      reading_mcq_single: 1,
      summarize_spoken_text: 1,
      listening_mcq_multiple: 2,
      listening_fill_blanks: 2,
      highlight_correct_summary: 1,
      write_from_dictation: 3,
    },
  },
];

export const templatePrice = (testType: TestType) =>
  testType === "mock" ? pricingConfig.fullMockPrice : pricingConfig.modulePrice;

export const distributionToRules = (distribution: Record<string, number>): TestTemplateRule[] =>
  Object.entries(distribution).map(([typeKey, questionCount], index) => ({
    typeKey,
    questionCount,
    position: index + 1,
  }));

export const sumRules = (rules: TestTemplateRule[]) =>
  rules.reduce((total, rule) => total + rule.questionCount, 0);

/** Estimated duration in minutes from the task types in a template. */
export const estimatedMinutes = (rules: TestTemplateRule[]) =>
  Math.max(
    1,
    Math.round(
      rules.reduce(
        (total, rule) =>
          total + (questionTypeMap[rule.typeKey]?.estimatedSeconds ?? 60) * rule.questionCount,
        0,
      ) / 60,
    ),
  );

export const typeName = (typeKey: string) => questionTypeMap[typeKey]?.name ?? typeKey;

export const typesForModule = (module: ModuleKey | null) =>
  module ? questionTypes.filter((type) => type.module === module) : questionTypes;

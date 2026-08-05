/**
 * Question bank catalogue — shared by the admin UI, the dynamic question
 * forms, the preview interface and the server-side validators.
 *
 * This module is client-safe (no server imports) so the same definitions
 * drive both the browser forms and the Worker handlers.
 */
import type { DifficultyKey, ModuleKey } from "@/config/site";

export type { DifficultyKey, ModuleKey };

export const moduleKeys: ModuleKey[] = ["speaking", "reading", "writing", "listening"];

export const moduleLabels: Record<ModuleKey, string> = {
  speaking: "Speaking",
  reading: "Reading",
  writing: "Writing",
  listening: "Listening",
};

export const difficultyKeys: DifficultyKey[] = ["easy", "intermediate", "hard"];

export const difficultyLabels: Record<DifficultyKey, string> = {
  easy: "Easy",
  intermediate: "Intermediate",
  hard: "Hard",
};

export const questionStatuses = [
  "draft",
  "under_review",
  "approved",
  "published",
  "archived",
] as const;

export type QuestionStatus = (typeof questionStatuses)[number];

export const statusLabels: Record<QuestionStatus, string> = {
  draft: "Draft",
  under_review: "Under review",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

export const statusVariant: Record<QuestionStatus, "secondary" | "warning" | "success" | "outline"> =
  {
    draft: "secondary",
    under_review: "warning",
    approved: "outline",
    published: "success",
    archived: "secondary",
  };

/** What the dynamic form and the preview need to render for a task type. */
export interface QuestionCapabilities {
  /** Multiple-choice options: single or multiple correct answers. */
  options?: "single" | "multiple" | undefined;
  /** Ordered paragraph / sentence blocks. */
  ordering?: boolean | undefined;
  /** Blanks with correct mappings; `choices` adds a shared word bank. */
  blanks?: boolean | undefined;
  blankChoices?: boolean | undefined;
  /** Reading passage or lecture transcript. */
  passage?: boolean | undefined;
  /** Expected transcript of the source audio. */
  transcript?: boolean | undefined;
  /** Requires an audio asset. */
  audio?: boolean | undefined;
  /** Requires an image asset. */
  image?: boolean | undefined;
  /** Free-text written response (essay / summary) with scoring criteria. */
  writtenResponse?: boolean | undefined;
  /** Spoken response recorded by the student. */
  spokenResponse?: boolean | undefined;
  /** Words the student highlights inside the passage. */
  highlightWords?: boolean | undefined;
  /** Short exact answer. */
  shortAnswer?: boolean | undefined;
}

export interface QuestionTypeDef {
  key: string;
  module: ModuleKey;
  name: string;
  description: string;
  estimatedSeconds: number;
  capabilities: QuestionCapabilities;
  scoringCriteria: string[];
}

export const questionTypes: QuestionTypeDef[] = [
  /* ------------------------------- Speaking ------------------------------- */
  {
    key: "read_aloud",
    module: "speaking",
    name: "Read Aloud",
    description: "The student reads a short text aloud within the preparation and recording time.",
    estimatedSeconds: 55,
    capabilities: { passage: true, audio: false, spokenResponse: true },
    scoringCriteria: ["content", "oral_fluency", "pronunciation"],
  },
  {
    key: "repeat_sentence",
    module: "speaking",
    name: "Repeat Sentence",
    description: "The student listens to a sentence and repeats it exactly.",
    estimatedSeconds: 35,
    capabilities: { audio: true, transcript: true, spokenResponse: true },
    scoringCriteria: ["content", "oral_fluency", "pronunciation"],
  },
  {
    key: "describe_image",
    module: "speaking",
    name: "Describe Image",
    description: "The student describes an image after 25 seconds of preparation.",
    estimatedSeconds: 65,
    capabilities: { image: true, spokenResponse: true },
    scoringCriteria: ["content", "oral_fluency", "pronunciation"],
  },
  {
    key: "retell_lecture",
    module: "speaking",
    name: "Retell Lecture",
    description: "The student listens to a lecture and retells it in their own words.",
    estimatedSeconds: 90,
    capabilities: { audio: true, transcript: true, spokenResponse: true },
    scoringCriteria: ["content", "oral_fluency", "pronunciation"],
  },
  {
    key: "answer_short_question",
    module: "speaking",
    name: "Answer Short Question",
    description: "The student answers a short general-knowledge question in one or a few words.",
    estimatedSeconds: 20,
    capabilities: { audio: true, transcript: true, shortAnswer: true, spokenResponse: true },
    scoringCriteria: ["content"],
  },
  {
    key: "respond_to_situation",
    module: "speaking",
    name: "Respond to a Situation",
    description: "The student responds appropriately to a described everyday situation.",
    estimatedSeconds: 60,
    capabilities: { audio: true, transcript: true, spokenResponse: true },
    scoringCriteria: ["appropriacy", "content", "oral_fluency", "pronunciation"],
  },
  {
    key: "summarize_group_discussion",
    module: "speaking",
    name: "Summarize Group Discussion",
    description: "The student summarises a short multi-speaker discussion.",
    estimatedSeconds: 130,
    capabilities: { audio: true, transcript: true, spokenResponse: true },
    scoringCriteria: ["content", "oral_fluency", "pronunciation"],
  },

  /* -------------------------------- Reading ------------------------------- */
  {
    key: "reading_writing_fill_blanks",
    module: "reading",
    name: "Reading and Writing Fill in the Blanks",
    description: "A passage with blanks; the student selects the best word from a dropdown.",
    estimatedSeconds: 120,
    capabilities: { passage: true, blanks: true, blankChoices: true },
    scoringCriteria: ["reading", "writing"],
  },
  {
    key: "reading_mcq_multiple",
    module: "reading",
    name: "Multiple Choice Multiple Answers",
    description: "A passage with a question that has more than one correct option.",
    estimatedSeconds: 120,
    capabilities: { passage: true, options: "multiple" },
    scoringCriteria: ["reading"],
  },
  {
    key: "reorder_paragraphs",
    module: "reading",
    name: "Re-order Paragraphs",
    description: "The student arranges jumbled text blocks into a logical order.",
    estimatedSeconds: 150,
    capabilities: { ordering: true },
    scoringCriteria: ["reading"],
  },
  {
    key: "reading_fill_blanks",
    module: "reading",
    name: "Reading Fill in the Blanks",
    description: "The student drags words from a word bank into the blanks in a passage.",
    estimatedSeconds: 120,
    capabilities: { passage: true, blanks: true, blankChoices: true },
    scoringCriteria: ["reading"],
  },
  {
    key: "reading_mcq_single",
    module: "reading",
    name: "Multiple Choice Single Answer",
    description: "A passage with a question that has exactly one correct option.",
    estimatedSeconds: 90,
    capabilities: { passage: true, options: "single" },
    scoringCriteria: ["reading"],
  },

  /* -------------------------------- Writing ------------------------------- */
  {
    key: "summarize_written_text",
    module: "writing",
    name: "Summarize Written Text",
    description: "The student summarises a passage in a single sentence of 5–75 words.",
    estimatedSeconds: 600,
    capabilities: { passage: true, writtenResponse: true },
    scoringCriteria: ["content", "form", "grammar", "vocabulary"],
  },
  {
    key: "write_essay",
    module: "writing",
    name: "Write Essay",
    description: "The student writes a 200–300 word argumentative essay on the given prompt.",
    estimatedSeconds: 1200,
    capabilities: { writtenResponse: true },
    scoringCriteria: [
      "content",
      "form",
      "development_structure_coherence",
      "grammar",
      "vocabulary",
      "spelling",
    ],
  },

  /* ------------------------------- Listening ------------------------------ */
  {
    key: "summarize_spoken_text",
    module: "listening",
    name: "Summarize Spoken Text",
    description: "The student writes a 50–70 word summary of a recording.",
    estimatedSeconds: 600,
    capabilities: { audio: true, transcript: true, writtenResponse: true },
    scoringCriteria: ["content", "form", "grammar", "vocabulary", "spelling"],
  },
  {
    key: "listening_mcq_multiple",
    module: "listening",
    name: "Multiple Choice Multiple Answers",
    description: "A recording followed by a question with more than one correct option.",
    estimatedSeconds: 120,
    capabilities: { audio: true, transcript: true, options: "multiple" },
    scoringCriteria: ["listening"],
  },
  {
    key: "listening_fill_blanks",
    module: "listening",
    name: "Listening Fill in the Blanks",
    description: "The student types the missing words in a transcript while listening.",
    estimatedSeconds: 120,
    capabilities: { audio: true, transcript: true, blanks: true },
    scoringCriteria: ["listening", "writing"],
  },
  {
    key: "highlight_correct_summary",
    module: "listening",
    name: "Highlight Correct Summary",
    description: "The student selects the paragraph that best summarises the recording.",
    estimatedSeconds: 120,
    capabilities: { audio: true, transcript: true, options: "single" },
    scoringCriteria: ["listening", "reading"],
  },
  {
    key: "listening_mcq_single",
    module: "listening",
    name: "Multiple Choice Single Answer",
    description: "A recording followed by a question with exactly one correct option.",
    estimatedSeconds: 90,
    capabilities: { audio: true, transcript: true, options: "single" },
    scoringCriteria: ["listening"],
  },
  {
    key: "select_missing_word",
    module: "listening",
    name: "Select Missing Word",
    description: "The recording is beeped at the end; the student selects the missing words.",
    estimatedSeconds: 70,
    capabilities: { audio: true, transcript: true, options: "single" },
    scoringCriteria: ["listening"],
  },
  {
    key: "highlight_incorrect_words",
    module: "listening",
    name: "Highlight Incorrect Words",
    description: "The student highlights transcript words that differ from the recording.",
    estimatedSeconds: 110,
    capabilities: { audio: true, transcript: true, passage: true, highlightWords: true },
    scoringCriteria: ["listening", "reading"],
  },
  {
    key: "write_from_dictation",
    module: "listening",
    name: "Write from Dictation",
    description: "The student types the sentence they hear, word for word.",
    estimatedSeconds: 60,
    capabilities: { audio: true, transcript: true, writtenResponse: true },
    scoringCriteria: ["listening", "writing"],
  },
];

export const questionTypeMap: Record<string, QuestionTypeDef> = Object.fromEntries(
  questionTypes.map((type) => [type.key, type]),
);

export function typesForModule(module: ModuleKey | "all"): QuestionTypeDef[] {
  return module === "all" ? questionTypes : questionTypes.filter((t) => t.module === module);
}

export function typeLabel(key: string): string {
  return questionTypeMap[key]?.name ?? key;
}

/* ------------------------------ content shapes ----------------------------- */

export interface QuestionOptionInput {
  id?: string | undefined;
  label: string;
  content: string;
  isCorrect: boolean;
  position: number;
}

export interface QuestionBlank {
  /** 1-based index matching the `[[1]]` marker in the passage. */
  index: number;
  answer: string;
  choices: string[];
}

export interface QuestionOrderingBlock {
  key: string;
  content: string;
  /** 1-based correct position. */
  correctPosition: number;
}

export interface QuestionContent {
  blanks?: QuestionBlank[] | undefined;
  wordBank?: string[] | undefined;
  ordering?: QuestionOrderingBlock[] | undefined;
  incorrectWords?: string[] | undefined;
  wordLimit?: { min: number; max: number } | undefined;
  preparationSeconds?: number | undefined;
  recordingSeconds?: number | undefined;
}

export interface QuestionAsset {
  id: string;
  kind: "audio" | "image";
  url: string;
  altText: string | null;
  transcript: string | null;
  durationSeconds: number | null;
  mimeType: string | null;
}

export interface QuestionRecord {
  id: string;
  module: ModuleKey;
  type: string;
  difficulty: DifficultyKey;
  title: string;
  instructions: string;
  prompt: string;
  passage: string;
  correctAnswer: string;
  alternativeAnswers: string[];
  modelAnswer: string;
  explanation: string;
  scoringConfig: Record<string, unknown>;
  scoreWeight: number;
  topic: string;
  tags: string[];
  estimatedSeconds: number;
  audio: QuestionAsset | null;
  image: QuestionAsset | null;
  sourceReference: string;
  adminNotes: string;
  aiConfidence: number | null;
  status: QuestionStatus;
  createdBy: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  version: number;
  options: QuestionOptionInput[];
  content: QuestionContent;
  usage: { attempts: number; avgScore: number | null; correctRate: number | null } | null;
}

export const questionSortOptions = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "usage_desc", label: "Most used" },
  { value: "performance_desc", label: "Best performance" },
  { value: "performance_asc", label: "Weakest performance" },
] as const;

export type QuestionSort = (typeof questionSortOptions)[number]["value"];

/** Which workflow transitions an admin may apply to a question. */
export function allowedTransitions(status: QuestionStatus): {
  action: string;
  label: string;
  to: QuestionStatus;
}[] {
  switch (status) {
    case "draft":
      return [{ action: "submit_review", label: "Submit for review", to: "under_review" }];
    case "under_review":
      return [
        { action: "approve", label: "Approve", to: "approved" },
        { action: "return_draft", label: "Return to draft", to: "draft" },
      ];
    case "approved":
      return [
        { action: "publish", label: "Publish", to: "published" },
        { action: "return_draft", label: "Return to draft", to: "draft" },
      ];
    case "published":
      return [
        { action: "unpublish", label: "Unpublish", to: "approved" },
        { action: "archive", label: "Archive", to: "archived" },
      ];
    case "archived":
      return [{ action: "restore", label: "Restore", to: "draft" }];
    default:
      return [];
  }
}

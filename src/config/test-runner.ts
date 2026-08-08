/**
 * Test-taking runtime configuration — client-safe.
 *
 * Holds the per-task-type behaviour the student runner needs (audio playback
 * limits, preparation/recording timings, navigation rules, word limits) plus
 * the answer payload shape shared by the renderers, the autosave queue and the
 * Worker validators.
 */
import { questionTypeMap, type ModuleKey } from "@/config/questions";

/* --------------------------------- answers -------------------------------- */

export interface AnswerData {
  /** Selected option ids (single or multiple choice). */
  selections: string[];
  /** Blank index (1-based, as string) → typed or selected word. */
  blanks: Record<string, string>;
  /** Ordering block keys in the student's chosen order. */
  ordering: string[];
  /** Word indexes the student highlighted inside the transcript. */
  highlighted: number[];
  /** Student marked this question for review. */
  flagged: boolean;
}

export interface AnswerPayload extends AnswerData {
  /** Free text: essays, summaries, dictation, short answers. */
  text: string;
  /** R2 object key of the uploaded spoken response. */
  audioKey: string | null;
  timeSpentSeconds: number;
}

export const emptyAnswer = (): AnswerPayload => ({
  text: "",
  selections: [],
  blanks: {},
  ordering: [],
  highlighted: [],
  flagged: false,
  audioKey: null,
  timeSpentSeconds: 0,
});

/* ------------------------------- task config ------------------------------- */

export interface RunnerTaskConfig {
  /** Students may return to earlier questions (reading + writing only). */
  allowPrevious: boolean;
  /** How many times the source audio may be played. 0 = the task has no audio. */
  audioPlays: number;
  /** Countdown before recording starts automatically. */
  preparationSeconds: number;
  /** Hard cap on the spoken response; recording stops automatically. */
  recordingSeconds: number;
  /** Student may listen back to their own recording before submitting. */
  allowRecordingPlayback: boolean;
  /** Student may discard a recording and record again. */
  allowRetry: boolean;
  /** Guidance shown by the word counter. */
  wordLimit?: { min: number; max: number } | undefined;
}

const speakingTimings: Record<string, { prep: number; record: number; plays: number }> = {
  read_aloud: { prep: 35, record: 40, plays: 0 },
  repeat_sentence: { prep: 0, record: 15, plays: 1 },
  describe_image: { prep: 25, record: 40, plays: 0 },
  retell_lecture: { prep: 10, record: 40, plays: 1 },
  answer_short_question: { prep: 0, record: 10, plays: 1 },
  respond_to_situation: { prep: 20, record: 40, plays: 1 },
  summarize_group_discussion: { prep: 10, record: 120, plays: 1 },
};

const wordLimits: Record<string, { min: number; max: number }> = {
  summarize_written_text: { min: 5, max: 75 },
  write_essay: { min: 200, max: 300 },
  summarize_spoken_text: { min: 50, max: 70 },
};

/** Modules where a student may navigate backwards during the test. */
export const backNavigationModules: ModuleKey[] = ["reading", "writing"];

export function taskConfig(typeKey: string): RunnerTaskConfig {
  const def = questionTypeMap[typeKey];
  const module = def?.module ?? "reading";
  const speaking = speakingTimings[typeKey];
  const hasAudio = def?.capabilities.audio === true;

  return {
    allowPrevious: backNavigationModules.includes(module),
    // Every PTE recording plays exactly once; replay is blocked by the player.
    audioPlays: speaking ? speaking.plays : hasAudio ? 1 : 0,
    preparationSeconds: speaking?.prep ?? 0,
    recordingSeconds: speaking?.record ?? 0,
    allowRecordingPlayback: false,
    allowRetry: false,
    wordLimit: wordLimits[typeKey],
  };
}

/* ------------------------------ runner question ---------------------------- */

/** Question payload sent to the browser — never contains answers or keys. */
export interface RunnerQuestion {
  attemptQuestionId: string;
  position: number;
  module: ModuleKey;
  typeKey: string;
  typeName: string;
  title: string;
  instructions: string;
  prompt: string;
  passage: string;
  estimatedSeconds: number;
  options: { id: string; label: string; content: string }[];
  /** Blank slots: index + optional shared word-bank choices. */
  blanks: { index: number; choices: string[] }[];
  wordBank: string[];
  /** Re-order blocks, already shuffled server-side. */
  orderingBlocks: { key: string; content: string }[];
  audio: { url: string; durationSeconds: number | null } | null;
  image: { url: string; altText: string | null } | null;
  config: RunnerTaskConfig;
}

export interface RunnerAnswer extends AnswerPayload {
  attemptQuestionId: string;
  revisionCount: number;
  updatedAt: string;
}

export interface RunnerSession {
  attempt: {
    id: string;
    templateName: string;
    module: ModuleKey | null;
    testType: string;
    status: string;
    questionCount: number;
    timeLimitMinutes: number;
    currentQuestion: number;
    instructions: string;
    startedAt: string | null;
    /** Absolute deadline; the runner submits automatically when it passes. */
    deadline: string | null;
    submittedAt: string | null;
  };
  questions: RunnerQuestion[];
  answers: RunnerAnswer[];
  serverTime: string;
}

/* ------------------------------ answered check ----------------------------- */

const wordsIn = (value: string) => value.trim().split(/\s+/).filter(Boolean).length;

/** Whether a payload counts as an answer for progress + the review screen. */
export function isAnswered(typeKey: string, answer: AnswerPayload): boolean {
  const def = questionTypeMap[typeKey];
  const caps = def?.capabilities ?? {};
  if (caps.spokenResponse) return Boolean(answer.audioKey);
  if (caps.options) return answer.selections.length > 0;
  if (caps.ordering) return answer.ordering.length > 0;
  if (caps.blanks) return Object.values(answer.blanks).some((value) => value.trim().length > 0);
  if (caps.highlightWords) return answer.highlighted.length > 0;
  return wordsIn(answer.text) > 0;
}

export const countWords = wordsIn;

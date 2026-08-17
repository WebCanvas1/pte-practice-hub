/**
 * Student test-taking runtime: sanitised question delivery, answer autosave,
 * spoken-response upload to R2, protected media streaming and submission.
 *
 * Security invariants enforced here:
 *  - correct answers, alternative answers, model answers, explanations,
 *    scoring config and asset transcripts never leave the server during a test
 *  - an answer can only be saved against a question assigned to that attempt
 *  - answers are immutable after final submission
 */
import type { QuestionRecord } from "@/config/questions";
import { questionTypeMap } from "@/config/questions";
import {
  emptyAnswer,
  isAnswered,
  taskConfig,
  type AnswerData,
  type RunnerAnswer,
  type RunnerQuestion,
  type RunnerSession,
} from "@/config/test-runner";
import type { TestAttemptRecord } from "@/config/tests";
import { getWorkerEnv } from "./bindings.server";
import { HttpError } from "./http.server";
import type { AttemptQuestionRecord, StoredAnswer, TestStore } from "./tests.server";

/* ------------------------------- sanitisation ------------------------------ */

/** Deterministic shuffle so a refresh keeps the same block order. */
function seededShuffle<T>(items: T[], seed: string): T[] {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const rand = () => {
    hash = (Math.imul(hash, 1103515245) + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function mediaUrl(attemptQuestionId: string, kind: "audio" | "image"): string {
  return `/api/public/tests/media?aq=${encodeURIComponent(attemptQuestionId)}&kind=${kind}`;
}

export function toRunnerQuestion(row: AttemptQuestionRecord): RunnerQuestion {
  const snapshot: QuestionRecord = row.snapshot;
  const def = questionTypeMap[row.typeKey];
  const caps = def?.capabilities ?? {};
  const content = snapshot.content ?? {};

  return {
    attemptQuestionId: row.id,
    position: row.position,
    module: row.module,
    typeKey: row.typeKey,
    typeName: row.typeName,
    title: snapshot.title,
    instructions: snapshot.instructions,
    prompt: snapshot.prompt,
    // Highlight-incorrect-words shows the transcript as the passage; everything
    // else only shows a passage when the task type has one.
    passage: caps.passage || caps.highlightWords ? snapshot.passage : "",
    estimatedSeconds: row.estimatedSeconds,
    // isCorrect is stripped — the browser never receives the key.
    options: [...(snapshot.options ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((option, index) => ({
        id: option.id ?? `opt_${index + 1}`,
        label: option.label,
        content: option.content,
      })),
    blanks: (content.blanks ?? []).map((blank) => ({
      index: blank.index,
      choices: caps.blankChoices ? blank.choices : [],
    })),
    wordBank: caps.blankChoices ? (content.wordBank ?? []) : [],
    orderingBlocks: seededShuffle(
      (content.ordering ?? []).map((block) => ({ key: block.key, content: block.content })),
      row.id,
    ),
    audio:
      caps.audio && snapshot.audio
        ? { url: mediaUrl(row.id, "audio"), durationSeconds: snapshot.audio.durationSeconds }
        : null,
    image:
      caps.image && snapshot.image
        ? { url: mediaUrl(row.id, "image"), altText: snapshot.image.altText }
        : null,
    config: taskConfig(row.typeKey),
  };
}

function toRunnerAnswer(answer: StoredAnswer): RunnerAnswer {
  return {
    ...emptyAnswer(),
    ...answer.data,
    attemptQuestionId: answer.attemptQuestionId,
    text: answer.text,
    audioKey: answer.audioKey,
    timeSpentSeconds: answer.timeSpentSeconds,
    revisionCount: answer.revisionCount,
    updatedAt: answer.updatedAt,
  };
}

/** Absolute deadline for an attempt: start time + the template time limit. */
export function attemptDeadline(attempt: TestAttemptRecord): string | null {
  if (!attempt.startedAt) return null;
  return new Date(
    new Date(attempt.startedAt).getTime() + attempt.timeLimitMinutes * 60 * 1000,
  ).toISOString();
}

export async function buildSession(
  store: TestStore,
  attempt: TestAttemptRecord,
  instructions: string,
): Promise<RunnerSession> {
  const [rows, answers] = await Promise.all([
    store.attemptQuestions(attempt.id),
    store.listAnswers(attempt.id),
  ]);
  return {
    attempt: {
      id: attempt.id,
      templateName: attempt.templateName,
      module: attempt.module,
      testType: attempt.testType,
      status: attempt.status,
      questionCount: attempt.questionCount,
      timeLimitMinutes: attempt.timeLimitMinutes,
      currentQuestion: attempt.currentQuestion,
      instructions,
      startedAt: attempt.startedAt,
      deadline: attemptDeadline(attempt),
      submittedAt: attempt.submittedAt,
    },
    questions: rows.map(toRunnerQuestion),
    answers: answers.map(toRunnerAnswer),
    serverTime: new Date().toISOString(),
  };
}

/* --------------------------------- guards --------------------------------- */

const EDITABLE_STATUSES = new Set(["in_progress", "paused", "ready", "purchased"]);

export function assertEditable(attempt: TestAttemptRecord): void {
  if (!EDITABLE_STATUSES.has(attempt.status)) {
    throw new HttpError(409, "This test has already been submitted and can no longer be edited.");
  }
}

/** Answers may only be saved against questions generated for this attempt. */
export async function requireAttemptQuestion(
  store: TestStore,
  attempt: TestAttemptRecord,
  attemptQuestionId: string,
): Promise<AttemptQuestionRecord> {
  const rows = await store.attemptQuestions(attempt.id);
  const row = rows.find((entry) => entry.id === attemptQuestionId);
  if (!row) throw new HttpError(403, "That question is not part of this test.");
  return row;
}

/** Server-side normalisation: only fields the task type actually supports. */
export function normaliseAnswer(
  typeKey: string,
  input: { text?: string | undefined; data?: Partial<AnswerData> | undefined },
): { text: string; data: AnswerData } {
  const caps = questionTypeMap[typeKey]?.capabilities ?? {};
  const data = input.data ?? {};
  const single = caps.options === "single";
  const selections = (data.selections ?? []).filter((value) => typeof value === "string");

  return {
    text:
      caps.writtenResponse || caps.shortAnswer || caps.blanks
        ? (input.text ?? "").slice(0, 20000)
        : "",
    data: {
      selections: caps.options ? (single ? selections.slice(0, 1) : selections.slice(0, 20)) : [],
      blanks: caps.blanks
        ? Object.fromEntries(
            Object.entries(data.blanks ?? {})
              .slice(0, 40)
              .map(([key, value]) => [key, String(value).slice(0, 120)]),
          )
        : {},
      ordering: caps.ordering ? (data.ordering ?? []).slice(0, 20).map(String) : [],
      highlighted: caps.highlightWords
        ? (data.highlighted ?? []).filter((value) => Number.isInteger(value)).slice(0, 200)
        : [],
      flagged: data.flagged === true,
    },
  };
}

/* --------------------------------- review --------------------------------- */

export interface ReviewItem {
  attemptQuestionId: string;
  position: number;
  typeName: string;
  module: string;
  answered: boolean;
  flagged: boolean;
}

export async function buildReview(
  store: TestStore,
  attempt: TestAttemptRecord,
): Promise<{ items: ReviewItem[]; answered: number; unanswered: number; flagged: number }> {
  const [rows, answers] = await Promise.all([
    store.attemptQuestions(attempt.id),
    store.listAnswers(attempt.id),
  ]);
  const items = rows.map((row) => {
    const stored = answers.find((answer) => answer.attemptQuestionId === row.id);
    const payload = stored ? toRunnerAnswer(stored) : emptyAnswer();
    return {
      attemptQuestionId: row.id,
      position: row.position,
      typeName: row.typeName,
      module: row.module as string,
      answered: isAnswered(row.typeKey, payload),
      flagged: payload.flagged,
    };
  });
  const answered = items.filter((item) => item.answered).length;
  return {
    items,
    answered,
    unanswered: items.length - answered,
    flagged: items.filter((item) => item.flagged).length,
  };
}

/* ---------------------------- R2 media handling ---------------------------- */

export async function putResponseAudio(
  key: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const env = await getWorkerEnv();
  if (!env.MEDIA) throw new Error("R2 binding MEDIA is required for audio storage.");
  await env.MEDIA.put(key, body, { httpMetadata: { contentType } });
}

export async function getMediaObject(
  key: string,
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const env = await getWorkerEnv();
  if (!env.MEDIA) throw new Error("R2 binding MEDIA is required for audio storage.");
  const object = (await env.MEDIA.get(key)) as
    | { arrayBuffer: () => Promise<ArrayBuffer>; httpMetadata?: { contentType?: string } }
    | null
    | undefined;
  if (!object) return null;
  return {
    body: await object.arrayBuffer(),
    contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
  };
}

export const responseAudioKey = (attemptId: string, attemptQuestionId: string) =>
  `responses/${attemptId}/${attemptQuestionId}.webm`;

/** Deterministic R2 key for seeded question media. */
export const questionMediaKey = (question: QuestionRecord, kind: "audio" | "image") =>
  `questions/${question.id}.${kind === "audio" ? "mp3" : "png"}`;

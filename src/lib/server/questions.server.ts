/**
 * Question bank data access.
 *
 * Mirrors the auth store pattern: a Cloudflare D1 implementation for
 * production and an in-memory implementation (pre-loaded with the generated
 * seed) so the admin screens are fully usable during local `vite dev`.
 */
import type { D1Database, WorkerEnv } from "./bindings.server";
import { newId } from "./crypto.server";
import { questionSeed } from "@/data/question-seed";
import {
  questionTypeMap,
  type DifficultyKey,
  type ModuleKey,
  type QuestionContent,
  type QuestionOptionInput,
  type QuestionRecord,
  type QuestionSort,
  type QuestionStatus,
} from "@/config/questions";

export interface QuestionFilters {
  search?: string | undefined;
  module?: ModuleKey | "all" | undefined;
  type?: string | "all" | undefined;
  difficulty?: DifficultyKey | "all" | undefined;
  status?: QuestionStatus | "all" | undefined;
  topic?: string | "all" | undefined;
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
  sort?: QuestionSort | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface QuestionListResult {
  rows: QuestionRecord[];
  total: number;
  page: number;
  pageSize: number;
  topics: string[];
  tags: string[];
}

export interface QuestionWriteInput {
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
  sourceReference: string;
  adminNotes: string;
  aiConfidence: number | null;
  content: QuestionContent;
  options: QuestionOptionInput[];
  audio: { url: string; transcript: string; durationSeconds: number | null } | null;
  image: { url: string; altText: string } | null;
}

export interface QuestionVersionSummary {
  id: string;
  versionNumber: number;
  status: QuestionStatus;
  changeNote: string;
  createdAt: string;
  createdBy: string | null;
}

export interface QuestionStore {
  readonly kind: "d1" | "memory";
  list: (filters: QuestionFilters) => Promise<QuestionListResult>;
  get: (id: string) => Promise<QuestionRecord | null>;
  create: (input: QuestionWriteInput, userId: string | null, status?: QuestionStatus) => Promise<QuestionRecord>;
  update: (
    id: string,
    input: QuestionWriteInput,
    userId: string | null,
    changeNote: string,
  ) => Promise<QuestionRecord>;
  duplicate: (id: string, userId: string | null) => Promise<QuestionRecord>;
  setStatus: (
    id: string,
    status: QuestionStatus,
    userId: string | null,
    action: string,
    comment: string,
  ) => Promise<QuestionRecord>;
  setDifficulty: (id: string, difficulty: DifficultyKey) => Promise<void>;
  addTags: (id: string, tags: string[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  versions: (id: string) => Promise<QuestionVersionSummary[]>;
  version: (id: string, versionNumber: number) => Promise<QuestionRecord | null>;
  restoreVersion: (id: string, versionNumber: number, userId: string | null) => Promise<QuestionRecord>;
}

const now = () => new Date().toISOString();

const slug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function emptyRecord(): QuestionRecord {
  return {
    id: "",
    module: "speaking",
    type: "read_aloud",
    difficulty: "easy",
    title: "",
    instructions: "",
    prompt: "",
    passage: "",
    correctAnswer: "",
    alternativeAnswers: [],
    modelAnswer: "",
    explanation: "",
    scoringConfig: {},
    scoreWeight: 1,
    topic: "",
    tags: [],
    estimatedSeconds: 60,
    audio: null,
    image: null,
    sourceReference: "",
    adminNotes: "",
    aiConfidence: null,
    status: "draft",
    createdBy: null,
    reviewedBy: null,
    createdAt: now(),
    updatedAt: now(),
    publishedAt: null,
    version: 1,
    options: [],
    content: {},
    usage: null,
  };
}

/** Applies a write payload onto a record without touching workflow metadata. */
function applyInput(record: QuestionRecord, input: QuestionWriteInput): QuestionRecord {
  return {
    ...record,
    module: input.module,
    type: input.type,
    difficulty: input.difficulty,
    title: input.title,
    instructions: input.instructions,
    prompt: input.prompt,
    passage: input.passage,
    correctAnswer: input.correctAnswer,
    alternativeAnswers: input.alternativeAnswers,
    modelAnswer: input.modelAnswer,
    explanation: input.explanation,
    scoringConfig: input.scoringConfig,
    scoreWeight: input.scoreWeight,
    topic: input.topic,
    tags: input.tags,
    estimatedSeconds: input.estimatedSeconds,
    sourceReference: input.sourceReference,
    adminNotes: input.adminNotes,
    aiConfidence: input.aiConfidence,
    content: input.content,
    options: input.options.map((option, index) => ({ ...option, position: index + 1 })),
    audio: input.audio
      ? {
          id: record.audio?.id ?? newId("qas"),
          kind: "audio",
          url: input.audio.url,
          transcript: input.audio.transcript,
          durationSeconds: input.audio.durationSeconds,
          altText: null,
          mimeType: "audio/mpeg",
        }
      : null,
    image: input.image
      ? {
          id: record.image?.id ?? newId("qas"),
          kind: "image",
          url: input.image.url,
          altText: input.image.altText,
          transcript: null,
          durationSeconds: null,
          mimeType: "image/png",
        }
      : null,
    updatedAt: now(),
  };
}

/* --------------------------- shared filter + sort -------------------------- */

export function filterAndSort(rows: QuestionRecord[], filters: QuestionFilters): QuestionRecord[] {
  const search = (filters.search ?? "").trim().toLowerCase();
  let out = rows.filter((row) => {
    if (filters.module && filters.module !== "all" && row.module !== filters.module) return false;
    if (filters.type && filters.type !== "all" && row.type !== filters.type) return false;
    if (filters.difficulty && filters.difficulty !== "all" && row.difficulty !== filters.difficulty)
      return false;
    if (filters.status && filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.topic && filters.topic !== "all" && row.topic !== filters.topic) return false;
    if (filters.createdFrom && row.createdAt < filters.createdFrom) return false;
    if (filters.createdTo && row.createdAt > `${filters.createdTo}T23:59:59.999Z`) return false;
    if (search) {
      const haystack = [row.id, row.title, row.prompt, row.passage, row.topic, row.tags.join(" ")]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const score = (row: QuestionRecord) => row.usage?.avgScore ?? -1;
  const attempts = (row: QuestionRecord) => row.usage?.attempts ?? 0;

  switch (filters.sort ?? "created_desc") {
    case "created_asc":
      out = out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      break;
    case "usage_desc":
      out = out.sort((a, b) => attempts(b) - attempts(a));
      break;
    case "performance_desc":
      out = out.sort((a, b) => score(b) - score(a));
      break;
    case "performance_asc":
      out = out.sort((a, b) => score(a) - score(b));
      break;
    default:
      out = out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return out;
}

function paginate(rows: QuestionRecord[], filters: QuestionFilters): QuestionListResult {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, filters.pageSize ?? 20));
  const start = (page - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    total: rows.length,
    page,
    pageSize,
    topics: [],
    tags: [],
  };
}

/* ---------------------------------- D1 ------------------------------------- */

interface QuestionRow {
  id: string;
  module_key: ModuleKey;
  type_key: string;
  difficulty: DifficultyKey;
  title: string;
  instructions: string;
  prompt: string;
  passage: string;
  correct_answer: string;
  alternative_answers: string;
  model_answer: string;
  explanation: string;
  scoring_config: string;
  score_weight: number;
  topic: string;
  content_json: string;
  estimated_seconds: number;
  audio_asset_id: string | null;
  image_asset_id: string | null;
  source_reference: string;
  admin_notes: string;
  ai_confidence: number | null;
  status: QuestionStatus;
  current_version: number;
  created_by: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  attempts: number | null;
  avg_score: number | null;
  correct_rate: number | null;
}

const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

function createD1QuestionStore(db: D1Database): QuestionStore {
  const all = <T>(sql: string, ...args: unknown[]) =>
    db
      .prepare(sql)
      .bind(...args)
      .all<T>()
      .then((r) => r.results);
  const first = <T>(sql: string, ...args: unknown[]) =>
    db
      .prepare(sql)
      .bind(...args)
      .first<T>();
  const run = (sql: string, ...args: unknown[]) =>
    db
      .prepare(sql)
      .bind(...args)
      .run();

  async function hydrate(rows: QuestionRow[]): Promise<QuestionRecord[]> {
    if (rows.length === 0) return [];
    const records: QuestionRecord[] = [];
    for (const row of rows) {
      const [options, tags, audio, image] = await Promise.all([
        all<{ id: string; label: string; content: string; is_correct: number; position: number }>(
          `SELECT id, label, content, is_correct, position FROM question_options WHERE question_id = ? ORDER BY position`,
          row.id,
        ),
        all<{ slug: string }>(
          `SELECT t.slug AS slug FROM question_tag_links l JOIN question_tags t ON t.id = l.tag_id WHERE l.question_id = ?`,
          row.id,
        ),
        row.audio_asset_id
          ? first<{ id: string; url: string; transcript: string | null; duration_seconds: number | null; mime_type: string | null }>(
              `SELECT id, url, transcript, duration_seconds, mime_type FROM question_assets WHERE id = ?`,
              row.audio_asset_id,
            )
          : Promise.resolve(null),
        row.image_asset_id
          ? first<{ id: string; url: string; alt_text: string | null; mime_type: string | null }>(
              `SELECT id, url, alt_text, mime_type FROM question_assets WHERE id = ?`,
              row.image_asset_id,
            )
          : Promise.resolve(null),
      ]);

      records.push({
        id: row.id,
        module: row.module_key,
        type: row.type_key,
        difficulty: row.difficulty,
        title: row.title,
        instructions: row.instructions,
        prompt: row.prompt,
        passage: row.passage,
        correctAnswer: row.correct_answer,
        alternativeAnswers: parseJson<string[]>(row.alternative_answers, []),
        modelAnswer: row.model_answer,
        explanation: row.explanation,
        scoringConfig: parseJson<Record<string, unknown>>(row.scoring_config, {}),
        scoreWeight: row.score_weight,
        topic: row.topic,
        tags: tags.map((t) => t.slug),
        estimatedSeconds: row.estimated_seconds,
        audio: audio
          ? {
              id: audio.id,
              kind: "audio",
              url: audio.url,
              transcript: audio.transcript,
              durationSeconds: audio.duration_seconds,
              altText: null,
              mimeType: audio.mime_type,
            }
          : null,
        image: image
          ? {
              id: image.id,
              kind: "image",
              url: image.url,
              altText: image.alt_text,
              transcript: null,
              durationSeconds: null,
              mimeType: image.mime_type,
            }
          : null,
        sourceReference: row.source_reference,
        adminNotes: row.admin_notes,
        aiConfidence: row.ai_confidence,
        status: row.status,
        createdBy: row.created_by,
        reviewedBy: row.reviewed_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        publishedAt: row.published_at,
        version: row.current_version,
        options: options.map((o) => ({
          id: o.id,
          label: o.label,
          content: o.content,
          isCorrect: o.is_correct === 1,
          position: o.position,
        })),
        content: parseJson<QuestionContent>(row.content_json, {}),
        usage: {
          attempts: row.attempts ?? 0,
          avgScore: row.avg_score,
          correctRate: row.correct_rate,
        },
      });
    }
    return records;
  }

  async function writeSideTables(record: QuestionRecord): Promise<void> {
    await run(`DELETE FROM question_options WHERE question_id = ?`, record.id);
    for (const option of record.options) {
      await run(
        `INSERT INTO question_options (id, question_id, label, content, is_correct, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        option.id ?? newId("qop"),
        record.id,
        option.label,
        option.content,
        option.isCorrect ? 1 : 0,
        option.position,
        now(),
      );
    }
    await run(`DELETE FROM question_tag_links WHERE question_id = ?`, record.id);
    for (const tag of record.tags) {
      const tagSlug = slug(tag);
      if (!tagSlug) continue;
      const existing = await first<{ id: string }>(
        `SELECT id FROM question_tags WHERE slug = ?`,
        tagSlug,
      );
      const tagId = existing?.id ?? newId("qtg");
      if (!existing) {
        await run(
          `INSERT INTO question_tags (id, slug, name, created_at) VALUES (?, ?, ?, ?)`,
          tagId,
          tagSlug,
          tag,
          now(),
        );
      }
      await run(
        `INSERT OR IGNORE INTO question_tag_links (question_id, tag_id, created_at) VALUES (?, ?, ?)`,
        record.id,
        tagId,
        now(),
      );
    }
    for (const asset of [record.audio, record.image]) {
      if (!asset) continue;
      await run(
        `INSERT INTO question_assets (id, question_id, kind, url, mime_type, duration_seconds, alt_text, transcript, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET url = excluded.url, alt_text = excluded.alt_text, transcript = excluded.transcript, duration_seconds = excluded.duration_seconds`,
        asset.id,
        record.id,
        asset.kind,
        asset.url,
        asset.mimeType,
        asset.durationSeconds,
        asset.altText,
        asset.transcript,
        now(),
      );
    }
    await run(
      `UPDATE questions SET audio_asset_id = ?, image_asset_id = ? WHERE id = ?`,
      record.audio?.id ?? null,
      record.image?.id ?? null,
      record.id,
    );
  }

  async function saveVersion(
    record: QuestionRecord,
    userId: string | null,
    note: string,
  ): Promise<void> {
    await run(
      `INSERT OR REPLACE INTO question_versions (id, question_id, version_number, snapshot, status, change_note, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      newId("qvr"),
      record.id,
      record.version,
      JSON.stringify(record),
      record.status,
      note,
      userId,
      now(),
    );
  }

  async function upsertQuestion(record: QuestionRecord): Promise<void> {
    await run(
      `INSERT INTO questions (id, module_key, type_key, difficulty, title, instructions, prompt, passage, correct_answer, alternative_answers, model_answer, explanation, scoring_config, score_weight, topic, content_json, estimated_seconds, source_reference, admin_notes, ai_confidence, status, current_version, created_by, reviewed_by, created_at, updated_at, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         module_key = excluded.module_key, type_key = excluded.type_key, difficulty = excluded.difficulty,
         title = excluded.title, instructions = excluded.instructions, prompt = excluded.prompt,
         passage = excluded.passage, correct_answer = excluded.correct_answer,
         alternative_answers = excluded.alternative_answers, model_answer = excluded.model_answer,
         explanation = excluded.explanation, scoring_config = excluded.scoring_config,
         score_weight = excluded.score_weight, topic = excluded.topic, content_json = excluded.content_json,
         estimated_seconds = excluded.estimated_seconds, source_reference = excluded.source_reference,
         admin_notes = excluded.admin_notes, ai_confidence = excluded.ai_confidence,
         status = excluded.status, current_version = excluded.current_version,
         reviewed_by = excluded.reviewed_by, updated_at = excluded.updated_at,
         published_at = excluded.published_at`,
      record.id,
      record.module,
      record.type,
      record.difficulty,
      record.title,
      record.instructions,
      record.prompt,
      record.passage,
      record.correctAnswer,
      JSON.stringify(record.alternativeAnswers),
      record.modelAnswer,
      record.explanation,
      JSON.stringify(record.scoringConfig),
      record.scoreWeight,
      record.topic,
      JSON.stringify(record.content),
      record.estimatedSeconds,
      record.sourceReference,
      record.adminNotes,
      record.aiConfidence,
      record.status,
      record.version,
      record.createdBy,
      record.reviewedBy,
      record.createdAt,
      record.updatedAt,
      record.publishedAt,
    );
  }

  const store: QuestionStore = {
    kind: "d1",

    async list(filters) {
      const rows = await all<QuestionRow>(
        `SELECT q.*, s.attempts AS attempts, s.avg_score AS avg_score, s.correct_rate AS correct_rate
         FROM questions q LEFT JOIN question_usage_stats s ON s.question_id = q.id`,
      );
      const records = await hydrate(rows);
      const filtered = filterAndSort(records, filters);
      const result = paginate(filtered, filters);
      result.topics = [...new Set(records.map((r) => r.topic).filter(Boolean))].sort();
      result.tags = [...new Set(records.flatMap((r) => r.tags))].sort();
      return result;
    },

    async get(id) {
      const row = await first<QuestionRow>(
        `SELECT q.*, s.attempts AS attempts, s.avg_score AS avg_score, s.correct_rate AS correct_rate
         FROM questions q LEFT JOIN question_usage_stats s ON s.question_id = q.id WHERE q.id = ?`,
        id,
      );
      if (!row) return null;
      const [record] = await hydrate([row]);
      return record ?? null;
    },

    async create(input, userId, status = "draft") {
      const record = applyInput(
        { ...emptyRecord(), id: newId("qst"), createdBy: userId, status, version: 1 },
        input,
      );
      await upsertQuestion(record);
      await writeSideTables(record);
      await run(
        `INSERT OR REPLACE INTO question_usage_stats (question_id, attempts, avg_score, correct_rate, avg_time_seconds, last_used_at, updated_at)
         VALUES (?, 0, NULL, NULL, NULL, NULL, ?)`,
        record.id,
        now(),
      );
      await saveVersion(record, userId, "Created");
      return record;
    },

    async update(id, input, userId, changeNote) {
      const current = await store.get(id);
      if (!current) throw new Error("Question not found");
      // Published questions are versioned on every edit; existing attempts keep
      // their recorded version because snapshots are immutable.
      const bumpVersion = current.status === "published" || current.status === "approved";
      const next = applyInput(
        { ...current, version: bumpVersion ? current.version + 1 : current.version },
        input,
      );
      await upsertQuestion(next);
      await writeSideTables(next);
      await saveVersion(next, userId, changeNote || (bumpVersion ? "Edited published question" : "Edited draft"));
      return next;
    },

    async duplicate(id, userId) {
      const current = await store.get(id);
      if (!current) throw new Error("Question not found");
      const copy = applyInput(
        { ...emptyRecord(), id: newId("qst"), createdBy: userId, status: "draft", version: 1 },
        { ...toWriteInput(current), title: `${current.title} (copy)` },
      );
      await upsertQuestion(copy);
      await writeSideTables(copy);
      await saveVersion(copy, userId, `Duplicated from ${current.id}`);
      return copy;
    },

    async setStatus(id, status, userId, action, comment) {
      const current = await store.get(id);
      if (!current) throw new Error("Question not found");
      const next: QuestionRecord = {
        ...current,
        status,
        reviewedBy: action === "approve" ? userId : current.reviewedBy,
        publishedAt: status === "published" ? now() : current.publishedAt,
        updatedAt: now(),
      };
      await upsertQuestion(next);
      await run(
        `INSERT INTO question_reviews (id, question_id, reviewer_id, action, from_status, to_status, comment, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        newId("qrv"),
        id,
        userId,
        action,
        current.status,
        status,
        comment,
        now(),
      );
      await saveVersion(next, userId, `Status changed to ${status}`);
      return next;
    },

    async setDifficulty(id, difficulty) {
      await run(
        `UPDATE questions SET difficulty = ?, updated_at = ? WHERE id = ?`,
        difficulty,
        now(),
        id,
      );
    },

    async addTags(id, tags) {
      const current = await store.get(id);
      if (!current) return;
      const merged = [...new Set([...current.tags, ...tags.map(slug).filter(Boolean)])];
      await writeSideTables({ ...current, tags: merged });
    },

    async remove(id) {
      await run(`DELETE FROM questions WHERE id = ?`, id);
    },

    async versions(id) {
      const rows = await all<{
        id: string;
        version_number: number;
        status: QuestionStatus;
        change_note: string;
        created_at: string;
        created_by: string | null;
      }>(
        `SELECT id, version_number, status, change_note, created_at, created_by FROM question_versions WHERE question_id = ? ORDER BY version_number DESC, created_at DESC`,
        id,
      );
      return rows.map((row) => ({
        id: row.id,
        versionNumber: row.version_number,
        status: row.status,
        changeNote: row.change_note,
        createdAt: row.created_at,
        createdBy: row.created_by,
      }));
    },

    async version(id, versionNumber) {
      const row = await first<{ snapshot: string }>(
        `SELECT snapshot FROM question_versions WHERE question_id = ? AND version_number = ? ORDER BY created_at DESC`,
        id,
        versionNumber,
      );
      return row ? parseJson<QuestionRecord | null>(row.snapshot, null) : null;
    },

    async restoreVersion(id, versionNumber, userId) {
      const snapshot = await store.version(id, versionNumber);
      if (!snapshot) throw new Error("Version not found");
      return store.update(id, toWriteInput(snapshot), userId, `Restored version ${versionNumber}`);
    },
  };

  return store;
}

/* -------------------------------- in memory ------------------------------- */

interface MemoryQuestionDb {
  questions: Map<string, QuestionRecord>;
  versions: Map<string, { summary: QuestionVersionSummary; snapshot: QuestionRecord }[]>;
  reviews: { questionId: string; action: string; comment: string; createdAt: string }[];
}

const globalRef = globalThis as unknown as { __pteQuestionDb?: MemoryQuestionDb };

function seedRecord(seedItem: (typeof questionSeed)[number], index: number): QuestionRecord {
  const createdAt = new Date(Date.UTC(2026, 0, 5 + (index % 40), 9, (index * 7) % 60)).toISOString();
  const def = questionTypeMap[seedItem.type];
  return {
    ...emptyRecord(),
    id: seedItem.id,
    module: seedItem.module,
    type: seedItem.type,
    difficulty: seedItem.difficulty,
    title: seedItem.title,
    instructions: seedItem.instructions,
    prompt: seedItem.prompt,
    passage: seedItem.passage,
    correctAnswer: seedItem.correctAnswer,
    alternativeAnswers: seedItem.alternativeAnswers,
    modelAnswer: seedItem.modelAnswer,
    explanation: seedItem.explanation,
    scoringConfig: seedItem.scoringConfig,
    scoreWeight: seedItem.scoreWeight,
    topic: seedItem.topic,
    tags: seedItem.tags,
    estimatedSeconds: seedItem.estimatedSeconds ?? def?.estimatedSeconds ?? 60,
    sourceReference: seedItem.sourceReference,
    adminNotes: seedItem.adminNotes,
    aiConfidence: seedItem.aiConfidence,
    status: seedItem.status,
    createdAt,
    updatedAt: createdAt,
    publishedAt: seedItem.status === "published" ? createdAt : null,
    version: 1,
    options: seedItem.options.map((option) => ({ ...option })),
    content: seedItem.content,
    audio: seedItem.audio
      ? {
          id: `${seedItem.id}_audio`,
          kind: "audio",
          url: seedItem.audio.url,
          transcript: seedItem.audio.transcript,
          durationSeconds: seedItem.audio.durationSeconds,
          altText: null,
          mimeType: "audio/mpeg",
        }
      : null,
    image: seedItem.image
      ? {
          id: `${seedItem.id}_image`,
          kind: "image",
          url: seedItem.image.url,
          altText: seedItem.image.altText,
          transcript: null,
          durationSeconds: null,
          mimeType: "image/png",
        }
      : null,
    usage: {
      attempts: seedItem.usage.attempts,
      avgScore: seedItem.usage.avgScore,
      correctRate: seedItem.usage.correctRate,
    },
  };
}

function memoryQuestionDb(): MemoryQuestionDb {
  if (!globalRef.__pteQuestionDb) {
    const db: MemoryQuestionDb = { questions: new Map(), versions: new Map(), reviews: [] };
    questionSeed.forEach((item, index) => {
      const record = seedRecord(item, index);
      db.questions.set(record.id, record);
      db.versions.set(record.id, [
        {
          summary: {
            id: `${record.id}_v1`,
            versionNumber: 1,
            status: record.status,
            changeNote: "Seed import",
            createdAt: record.createdAt,
            createdBy: null,
          },
          snapshot: record,
        },
      ]);
    });
    globalRef.__pteQuestionDb = db;
  }
  return globalRef.__pteQuestionDb;
}

export function toWriteInput(record: QuestionRecord): QuestionWriteInput {
  return {
    module: record.module,
    type: record.type,
    difficulty: record.difficulty,
    title: record.title,
    instructions: record.instructions,
    prompt: record.prompt,
    passage: record.passage,
    correctAnswer: record.correctAnswer,
    alternativeAnswers: record.alternativeAnswers,
    modelAnswer: record.modelAnswer,
    explanation: record.explanation,
    scoringConfig: record.scoringConfig,
    scoreWeight: record.scoreWeight,
    topic: record.topic,
    tags: record.tags,
    estimatedSeconds: record.estimatedSeconds,
    sourceReference: record.sourceReference,
    adminNotes: record.adminNotes,
    aiConfidence: record.aiConfidence,
    content: record.content,
    options: record.options,
    audio: record.audio
      ? {
          url: record.audio.url,
          transcript: record.audio.transcript ?? "",
          durationSeconds: record.audio.durationSeconds,
        }
      : null,
    image: record.image ? { url: record.image.url, altText: record.image.altText ?? "" } : null,
  };
}

function createMemoryQuestionStore(): QuestionStore {
  const db = memoryQuestionDb();

  const pushVersion = (record: QuestionRecord, userId: string | null, note: string) => {
    const list = db.versions.get(record.id) ?? [];
    list.unshift({
      summary: {
        id: newId("qvr"),
        versionNumber: record.version,
        status: record.status,
        changeNote: note,
        createdAt: now(),
        createdBy: userId,
      },
      snapshot: record,
    });
    db.versions.set(record.id, list);
  };

  const store: QuestionStore = {
    kind: "memory",

    async list(filters) {
      const records = [...db.questions.values()];
      const result = paginate(filterAndSort(records, filters), filters);
      result.topics = [...new Set(records.map((r) => r.topic).filter(Boolean))].sort();
      result.tags = [...new Set(records.flatMap((r) => r.tags))].sort();
      return result;
    },

    async get(id) {
      return db.questions.get(id) ?? null;
    },

    async create(input, userId, status = "draft") {
      const record = applyInput(
        { ...emptyRecord(), id: newId("qst"), createdBy: userId, status, version: 1 },
        input,
      );
      db.questions.set(record.id, record);
      pushVersion(record, userId, "Created");
      return record;
    },

    async update(id, input, userId, changeNote) {
      const current = db.questions.get(id);
      if (!current) throw new Error("Question not found");
      const bumpVersion = current.status === "published" || current.status === "approved";
      const next = applyInput(
        { ...current, version: bumpVersion ? current.version + 1 : current.version },
        input,
      );
      db.questions.set(id, next);
      pushVersion(
        next,
        userId,
        changeNote || (bumpVersion ? "Edited published question" : "Edited draft"),
      );
      return next;
    },

    async duplicate(id, userId) {
      const current = db.questions.get(id);
      if (!current) throw new Error("Question not found");
      const copy = applyInput(
        { ...emptyRecord(), id: newId("qst"), createdBy: userId, status: "draft", version: 1 },
        { ...toWriteInput(current), title: `${current.title} (copy)` },
      );
      db.questions.set(copy.id, copy);
      pushVersion(copy, userId, `Duplicated from ${current.id}`);
      return copy;
    },

    async setStatus(id, status, userId, action, comment) {
      const current = db.questions.get(id);
      if (!current) throw new Error("Question not found");
      const next: QuestionRecord = {
        ...current,
        status,
        reviewedBy: action === "approve" ? userId : current.reviewedBy,
        publishedAt: status === "published" ? now() : current.publishedAt,
        updatedAt: now(),
      };
      db.questions.set(id, next);
      db.reviews.push({ questionId: id, action, comment, createdAt: now() });
      pushVersion(next, userId, `Status changed to ${status}`);
      return next;
    },

    async setDifficulty(id, difficulty) {
      const current = db.questions.get(id);
      if (current) db.questions.set(id, { ...current, difficulty, updatedAt: now() });
    },

    async addTags(id, tags) {
      const current = db.questions.get(id);
      if (!current) return;
      const merged = [...new Set([...current.tags, ...tags.map(slug).filter(Boolean)])];
      db.questions.set(id, { ...current, tags: merged, updatedAt: now() });
    },

    async remove(id) {
      db.questions.delete(id);
      db.versions.delete(id);
    },

    async versions(id) {
      return (db.versions.get(id) ?? []).map((entry) => entry.summary);
    },

    async version(id, versionNumber) {
      return (
        (db.versions.get(id) ?? []).find((entry) => entry.summary.versionNumber === versionNumber)
          ?.snapshot ?? null
      );
    },

    async restoreVersion(id, versionNumber, userId) {
      const snapshot = await store.version(id, versionNumber);
      if (!snapshot) throw new Error("Version not found");
      return store.update(id, toWriteInput(snapshot), userId, `Restored version ${versionNumber}`);
    },
  };

  return store;
}

export function getQuestionStore(env: WorkerEnv): QuestionStore {
  return env.DB ? createD1QuestionStore(env.DB) : createMemoryQuestionStore();
}

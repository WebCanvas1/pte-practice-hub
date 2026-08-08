/**
 * Test templates, test generation and attempt management.
 *
 * Mirrors the question-bank store pattern: a Cloudflare D1 implementation for
 * production and an in-memory implementation seeded from
 * src/config/tests.ts `defaultTemplates` so the screens work during
 * local `vite dev` without any bindings.
 */
import type { D1Database, WorkerEnv } from "./bindings.server";
import { newId } from "./crypto.server";
import { getQuestionStore, type QuestionStore } from "./questions.server";
import type { DifficultyKey, ModuleKey, QuestionRecord } from "@/config/questions";
import { difficultyKeys, questionTypeMap } from "@/config/questions";
import {
  defaultTemplates,
  distributionToRules,
  sumRules,
  templatePrice,
  type AttemptQuestionSummary,
  type AttemptStatus,
  type EntitlementRecord,
  type TemplateDifficulty,
  type TemplateRuleAvailability,
  type TemplateValidation,
  type TestAttemptRecord,
  type TestTemplateRecord,
  type TestTemplateRule,
  type TestType,
} from "@/config/tests";
import { pricingConfig } from "@/config/site";
import type { AnswerData } from "@/config/test-runner";

const now = () => new Date().toISOString();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/* --------------------------------- inputs ---------------------------------- */

export interface TemplateWriteInput {
  name: string;
  description: string;
  testType: TestType;
  module: ModuleKey | null;
  difficulty: TemplateDifficulty;
  price: number;
  currency: string;
  timeLimitMinutes: number;
  targetScore: number | null;
  instructions: string;
  isActive: boolean;
  purchasable: boolean;
  rules: { typeKey: string; questionCount: number; difficulty?: DifficultyKey | undefined }[];
}

export interface TemplateFilters {
  testType?: TestType | "all" | undefined;
  module?: ModuleKey | "all" | undefined;
  difficulty?: TemplateDifficulty | "all" | undefined;
  activeOnly?: boolean | undefined;
  purchasableOnly?: boolean | undefined;
}

export interface AttemptQuestionRecord extends AttemptQuestionSummary {
  snapshot: QuestionRecord;
}

export interface GenerationResult {
  ok: boolean;
  questions: QuestionRecord[];
  shortfalls: TemplateRuleAvailability[];
  warnings: string[];
  reusedRecent: number;
}

export interface TestStore {
  readonly kind: "d1" | "memory";
  listTemplates: (filters: TemplateFilters) => Promise<TestTemplateRecord[]>;
  getTemplate: (id: string) => Promise<TestTemplateRecord | null>;
  createTemplate: (input: TemplateWriteInput, userId: string | null) => Promise<TestTemplateRecord>;
  updateTemplate: (
    id: string,
    input: TemplateWriteInput,
    bumpVersion: boolean,
  ) => Promise<TestTemplateRecord>;
  duplicateTemplate: (id: string, userId: string | null) => Promise<TestTemplateRecord>;
  setTemplateActive: (id: string, isActive: boolean) => Promise<TestTemplateRecord>;
  removeTemplate: (id: string) => Promise<void>;

  listEntitlements: (userId: string) => Promise<EntitlementRecord[]>;
  getEntitlement: (id: string) => Promise<EntitlementRecord | null>;
  findActiveEntitlement: (userId: string, templateId: string) => Promise<EntitlementRecord | null>;
  grantEntitlement: (
    userId: string,
    templateId: string,
    source: string,
    price: number,
    currency: string,
  ) => Promise<EntitlementRecord>;
  markEntitlementUsed: (id: string, attemptId: string) => Promise<void>;

  listAttempts: (userId: string | null) => Promise<TestAttemptRecord[]>;
  getAttempt: (id: string) => Promise<TestAttemptRecord | null>;
  createAttempt: (
    attempt: Omit<TestAttemptRecord, "questions">,
    questions: AttemptQuestionRecord[],
  ) => Promise<TestAttemptRecord>;
  setAttemptStatus: (
    id: string,
    status: AttemptStatus,
    patch?: Partial<Pick<TestAttemptRecord, "startedAt" | "submittedAt" | "completedAt">>,
  ) => Promise<TestAttemptRecord>;
  recentQuestionIds: (userId: string, limit: number) => Promise<string[]>;
  logEvent: (
    attemptId: string,
    userId: string | null,
    eventType: string,
    metadata?: Record<string, unknown>,
  ) => Promise<void>;

  /** Full question snapshots for an attempt (server-side only). */
  attemptQuestions: (attemptId: string) => Promise<AttemptQuestionRecord[]>;
  listAnswers: (attemptId: string) => Promise<StoredAnswer[]>;
  saveAnswer: (input: SaveAnswerInput) => Promise<StoredAnswer>;
  finalizeAnswers: (attemptId: string) => Promise<void>;
  setCurrentQuestion: (attemptId: string, position: number) => Promise<void>;
}

/** Persisted student answer. */
export interface StoredAnswer {
  attemptQuestionId: string;
  text: string;
  data: AnswerData;
  audioKey: string | null;
  timeSpentSeconds: number;
  revisionCount: number;
  isFinal: boolean;
  updatedAt: string;
}

export interface SaveAnswerInput {
  attemptId: string;
  attemptQuestionId: string;
  userId: string;
  text: string;
  data: AnswerData;
  audioKey?: string | null | undefined;
  timeSpentSeconds: number;
}

const emptyData = (): AnswerData => ({
  selections: [],
  blanks: {},
  ordering: [],
  highlighted: [],
  flagged: false,
});

/* --------------------------- template normalisation ------------------------ */

function rulesFromInput(input: TemplateWriteInput): TestTemplateRule[] {
  return input.rules
    .filter((rule) => rule.questionCount > 0)
    .map((rule, index) => ({
      id: newId("ttr"),
      typeKey: rule.typeKey,
      questionCount: rule.questionCount,
      difficulty: rule.difficulty,
      position: index + 1,
    }));
}

function applyTemplateInput(
  base: TestTemplateRecord,
  input: TemplateWriteInput,
): TestTemplateRecord {
  const rules = rulesFromInput(input);
  return {
    ...base,
    name: input.name,
    description: input.description,
    testType: input.testType,
    module: input.testType === "mock" ? null : input.module,
    difficulty: input.difficulty,
    price: input.price,
    currency: input.currency,
    timeLimitMinutes: input.timeLimitMinutes,
    targetScore: input.targetScore,
    instructions: input.instructions,
    isActive: input.isActive,
    purchasable: input.purchasable,
    rules,
    questionCount: sumRules(rules),
    updatedAt: now(),
  };
}

export function templateToInput(template: TestTemplateRecord): TemplateWriteInput {
  return {
    name: template.name,
    description: template.description,
    testType: template.testType,
    module: template.module,
    difficulty: template.difficulty,
    price: template.price,
    currency: template.currency,
    timeLimitMinutes: template.timeLimitMinutes,
    targetScore: template.targetScore,
    instructions: template.instructions,
    isActive: template.isActive,
    purchasable: template.purchasable,
    rules: template.rules.map((rule) => ({
      typeKey: rule.typeKey,
      questionCount: rule.questionCount,
      difficulty: rule.difficulty,
    })),
  };
}

export function seedTemplates(): TestTemplateRecord[] {
  const created = "2026-01-05T00:00:00.000Z";
  return defaultTemplates.map((def) => {
    const rules = distributionToRules(def.distribution).map((rule) => ({
      ...rule,
      id: `ttr_${def.slug}_${rule.typeKey}`,
    }));
    return {
      id: `tpl_${def.slug.replace(/-/g, "_")}`,
      name: def.name,
      description: def.description,
      testType: def.testType,
      module: def.module,
      difficulty: def.difficulty,
      price: templatePrice(def.testType),
      currency: pricingConfig.currency,
      questionCount: sumRules(rules),
      timeLimitMinutes: def.timeLimitMinutes,
      targetScore: def.targetScore,
      instructions: def.instructions,
      isActive: def.isActive ?? true,
      purchasable: true,
      version: 1,
      createdAt: created,
      updatedAt: created,
      rules,
    } satisfies TestTemplateRecord;
  });
}

function matchesTemplateFilters(template: TestTemplateRecord, filters: TemplateFilters): boolean {
  if (filters.testType && filters.testType !== "all" && template.testType !== filters.testType)
    return false;
  if (filters.module && filters.module !== "all" && template.module !== filters.module) return false;
  if (
    filters.difficulty &&
    filters.difficulty !== "all" &&
    template.difficulty !== filters.difficulty
  )
    return false;
  if (filters.activeOnly && !template.isActive) return false;
  if (filters.purchasableOnly && !template.purchasable) return false;
  return true;
}

/* --------------------------- generation + validation ------------------------ */

/** Difficulties a rule may draw from. `mixed` templates spread across all. */
function ruleDifficulties(
  template: TestTemplateRecord,
  rule: TestTemplateRule,
): DifficultyKey[] {
  if (rule.difficulty) return [rule.difficulty];
  if (template.difficulty === "mixed") return [...difficultyKeys];
  return [template.difficulty as DifficultyKey];
}

async function publishedPool(questions: QuestionStore): Promise<QuestionRecord[]> {
  const result = await questions.list({ status: "published", pageSize: 1000, page: 1 });
  return result.rows;
}

function availabilityFor(
  pool: QuestionRecord[],
  template: TestTemplateRecord,
): TemplateRuleAvailability[] {
  return template.rules.map((rule) => {
    const def = questionTypeMap[rule.typeKey];
    const difficulties = ruleDifficulties(template, rule);
    const available = pool.filter(
      (question) =>
        question.type === rule.typeKey &&
        difficulties.includes(question.difficulty) &&
        (!def || question.module === def.module),
    ).length;
    return {
      typeKey: rule.typeKey,
      typeName: def?.name ?? rule.typeKey,
      module: def?.module ?? (template.module ?? "speaking"),
      difficulty: difficulties.length === 1 ? difficulties[0]! : "intermediate",
      required: rule.questionCount,
      available,
      shortfall: Math.max(0, rule.questionCount - available),
    };
  });
}

/** Template validation tool: warns when the bank cannot fill a template. */
export async function validateTemplate(
  questions: QuestionStore,
  template: TestTemplateRecord,
  pool?: QuestionRecord[],
): Promise<TemplateValidation> {
  const questionPool = pool ?? (await publishedPool(questions));
  const rules = availabilityFor(questionPool, template);
  const warnings: string[] = [];

  if (template.rules.length === 0) warnings.push("This template has no question-type rules yet.");
  for (const rule of rules) {
    if (rule.shortfall > 0) {
      warnings.push(
        `${rule.typeName}: needs ${rule.required} published ${rule.difficulty} question${
          rule.required === 1 ? "" : "s"
        }, only ${rule.available} available (${rule.shortfall} short).`,
      );
    }
  }
  if (template.questionCount !== sumRules(template.rules)) {
    warnings.push("Question count does not match the sum of the distribution rules.");
  }
  const modulesInRules = new Set(
    template.rules.map((rule) => questionTypeMap[rule.typeKey]?.module).filter(Boolean),
  );
  if (template.testType === "mock" && modulesInRules.size < 4) {
    warnings.push("A complete mock test should include all four modules.");
  }
  if (template.testType === "module" && template.module && modulesInRules.size > 0) {
    for (const key of modulesInRules) {
      if (key !== template.module)
        warnings.push(`Rule for ${key} task type does not belong to the ${template.module} module.`);
    }
  }

  return {
    templateId: template.id,
    ok: warnings.length === 0,
    requiredTotal: rules.reduce((total, rule) => total + rule.required, 0),
    availableTotal: rules.reduce((total, rule) => total + rule.available, 0),
    rules,
    warnings,
  };
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Generation rules:
 *  - published questions only
 *  - module + difficulty must match the template / rule
 *  - the required per-type distribution must be satisfied
 *  - questions recently attempted by the student are avoided where possible
 *  - randomised within those rules
 *  - no duplicate questions inside the same test
 */
export async function generateTest(
  questions: QuestionStore,
  template: TestTemplateRecord,
  options: { recentQuestionIds?: string[] | undefined } = {},
): Promise<GenerationResult> {
  const pool = await publishedPool(questions);
  const recent = new Set(options.recentQuestionIds ?? []);
  const used = new Set<string>();
  const selected: QuestionRecord[] = [];
  const shortfalls: TemplateRuleAvailability[] = [];
  const warnings: string[] = [];
  let reusedRecent = 0;

  for (const rule of [...template.rules].sort((a, b) => a.position - b.position)) {
    const def = questionTypeMap[rule.typeKey];
    const difficulties = ruleDifficulties(template, rule);
    const candidates = pool.filter(
      (question) =>
        question.type === rule.typeKey &&
        difficulties.includes(question.difficulty) &&
        (!def || question.module === def.module) &&
        !used.has(question.id),
    );
    const fresh = shuffle(candidates.filter((question) => !recent.has(question.id)));
    const seen = shuffle(candidates.filter((question) => recent.has(question.id)));
    const ordered = [...fresh, ...seen];
    const picked = ordered.slice(0, rule.questionCount);

    for (const question of picked) {
      used.add(question.id);
      if (recent.has(question.id)) reusedRecent += 1;
      selected.push(question);
    }

    if (picked.length < rule.questionCount) {
      const label = def?.name ?? rule.typeKey;
      shortfalls.push({
        typeKey: rule.typeKey,
        typeName: label,
        module: def?.module ?? (template.module ?? "speaking"),
        difficulty: difficulties.length === 1 ? difficulties[0]! : "intermediate",
        required: rule.questionCount,
        available: picked.length,
        shortfall: rule.questionCount - picked.length,
      });
      warnings.push(
        `${label}: only ${picked.length} of ${rule.questionCount} published questions available.`,
      );
    }
  }

  if (reusedRecent > 0) {
    warnings.push(
      `${reusedRecent} question${reusedRecent === 1 ? "" : "s"} were recently attempted by this student — the bank had no fresh alternative.`,
    );
  }

  return { ok: shortfalls.length === 0, questions: selected, shortfalls, warnings, reusedRecent };
}

export function toAttemptQuestions(records: QuestionRecord[]): AttemptQuestionRecord[] {
  return records.map((question, index) => ({
    id: newId("atq"),
    position: index + 1,
    questionId: question.id,
    questionVersion: question.version,
    module: question.module,
    typeKey: question.type,
    typeName: questionTypeMap[question.type]?.name ?? question.type,
    difficulty: question.difficulty,
    title: question.title,
    estimatedSeconds: question.estimatedSeconds,
    // Permanent snapshot: later edits to the source question never affect this attempt.
    snapshot: question,
  }));
}

/* ------------------------------ memory store ------------------------------- */

interface MemoryDb {
  templates: Map<string, TestTemplateRecord>;
  entitlements: Map<string, EntitlementRecord & { pricePaid: number; currency: string }>;
  attempts: Map<string, TestAttemptRecord>;
  attemptQuestions: Map<string, AttemptQuestionRecord[]>;
  answers: Map<string, StoredAnswer & { attemptId: string }>;
  events: { attemptId: string; userId: string | null; eventType: string; createdAt: string }[];
}

const memoryDb: MemoryDb = {
  templates: new Map(seedTemplates().map((template) => [template.id, template])),
  entitlements: new Map(),
  attempts: new Map(),
  attemptQuestions: new Map(),
  answers: new Map(),
  events: [],
};

function createMemoryTestStore(): TestStore {
  const db = memoryDb;

  const requireTemplate = (id: string) => {
    const template = db.templates.get(id);
    if (!template) throw new Error("Template not found");
    return template;
  };

  const store: TestStore = {
    kind: "memory",

    async listTemplates(filters) {
      return [...db.templates.values()]
        .filter((template) => matchesTemplateFilters(template, filters))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    async getTemplate(id) {
      return db.templates.get(id) ?? null;
    },

    async createTemplate(input) {
      const base: TestTemplateRecord = {
        id: newId("tpl"),
        name: input.name,
        description: "",
        testType: input.testType,
        module: input.module,
        difficulty: input.difficulty,
        price: input.price,
        currency: input.currency,
        questionCount: 0,
        timeLimitMinutes: input.timeLimitMinutes,
        targetScore: input.targetScore,
        instructions: "",
        isActive: input.isActive,
        purchasable: input.purchasable,
        version: 1,
        createdAt: now(),
        updatedAt: now(),
        rules: [],
      };
      const record = applyTemplateInput(base, input);
      db.templates.set(record.id, record);
      return record;
    },

    async updateTemplate(id, input, bumpVersion) {
      const existing = requireTemplate(id);
      const record = applyTemplateInput(existing, input);
      record.version = bumpVersion ? existing.version + 1 : existing.version;
      db.templates.set(id, record);
      return record;
    },

    async duplicateTemplate(id) {
      const existing = requireTemplate(id);
      const record: TestTemplateRecord = {
        ...existing,
        id: newId("tpl"),
        name: `${existing.name} (copy)`,
        isActive: false,
        purchasable: false,
        version: 1,
        createdAt: now(),
        updatedAt: now(),
        rules: existing.rules.map((rule) => ({ ...rule, id: newId("ttr") })),
      };
      db.templates.set(record.id, record);
      return record;
    },

    async setTemplateActive(id, isActive) {
      const existing = requireTemplate(id);
      const record = { ...existing, isActive, purchasable: isActive && existing.purchasable, updatedAt: now() };
      db.templates.set(id, record);
      return record;
    },

    async removeTemplate(id) {
      db.templates.delete(id);
    },

    async listEntitlements(userId) {
      return [...db.entitlements.values()].filter((row) => row.userId === userId);
    },

    async getEntitlement(id) {
      return db.entitlements.get(id) ?? null;
    },

    async findActiveEntitlement(userId, templateId) {
      return (
        [...db.entitlements.values()].find(
          (row) => row.userId === userId && row.templateId === templateId && row.status === "active",
        ) ?? null
      );
    },

    async grantEntitlement(userId, templateId, source, price, currency) {
      const record = {
        id: newId("ent"),
        userId,
        templateId,
        status: "active" as const,
        attemptId: null,
        source,
        pricePaid: price,
        currency,
        createdAt: now(),
        expiresAt: null,
      };
      db.entitlements.set(record.id, record);
      return record;
    },

    async markEntitlementUsed(id, attemptId) {
      const existing = db.entitlements.get(id);
      if (!existing) return;
      db.entitlements.set(id, { ...existing, status: "used", attemptId });
    },

    async listAttempts(userId) {
      return [...db.attempts.values()]
        .filter((attempt) => !userId || attempt.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async getAttempt(id) {
      return db.attempts.get(id) ?? null;
    },

    async createAttempt(attempt, questions) {
      const record: TestAttemptRecord = {
        ...attempt,
        questions: questions.map(({ snapshot: _snapshot, ...summary }) => summary),
      };
      db.attempts.set(record.id, record);
      db.attemptQuestions.set(record.id, questions);
      return record;
    },

    async setAttemptStatus(id, status, patch) {
      const existing = db.attempts.get(id);
      if (!existing) throw new Error("Attempt not found");
      const record = { ...existing, ...patch, status };
      db.attempts.set(id, record);
      return record;
    },

    async recentQuestionIds(userId, limit) {
      const ids: string[] = [];
      for (const attempt of await store.listAttempts(userId)) {
        for (const question of attempt.questions) {
          if (!ids.includes(question.questionId)) ids.push(question.questionId);
          if (ids.length >= limit) return ids;
        }
      }
      return ids;
    },

    async logEvent(attemptId, userId, eventType) {
      db.events.push({ attemptId, userId, eventType, createdAt: now() });
    },

    async attemptQuestions(attemptId) {
      return db.attemptQuestions.get(attemptId) ?? [];
    },

    async listAnswers(attemptId) {
      return [...db.answers.values()].filter((answer) => answer.attemptId === attemptId);
    },

    async saveAnswer(input) {
      const existing = db.answers.get(input.attemptQuestionId);
      if (existing?.isFinal) return existing;
      const record = {
        attemptId: input.attemptId,
        attemptQuestionId: input.attemptQuestionId,
        text: input.text,
        data: input.data,
        audioKey: input.audioKey ?? existing?.audioKey ?? null,
        timeSpentSeconds: Math.max(input.timeSpentSeconds, existing?.timeSpentSeconds ?? 0),
        revisionCount: (existing?.revisionCount ?? 0) + 1,
        isFinal: false,
        updatedAt: now(),
      };
      db.answers.set(input.attemptQuestionId, record);
      const attempt = db.attempts.get(input.attemptId);
      if (attempt) {
        db.attempts.set(input.attemptId, {
          ...attempt,
          answeredCount: (await store.listAnswers(input.attemptId)).length,
        });
      }
      return record;
    },

    async finalizeAnswers(attemptId) {
      for (const [key, answer] of db.answers) {
        if (answer.attemptId === attemptId) db.answers.set(key, { ...answer, isFinal: true });
      }
    },

    async setCurrentQuestion(attemptId, position) {
      const attempt = db.attempts.get(attemptId);
      if (attempt) db.attempts.set(attemptId, { ...attempt, currentQuestion: position });
    },
  };

  return store;
}

/* -------------------------------- D1 store -------------------------------- */

interface TemplateRow {
  id: string;
  name: string;
  description: string;
  test_type: TestType;
  module_key: ModuleKey | null;
  difficulty: TemplateDifficulty;
  price: number;
  currency: string;
  question_count: number;
  time_limit_minutes: number;
  target_score: number | null;
  instructions: string;
  is_active: number;
  purchasable: number;
  version: number;
  created_at: string;
  updated_at: string;
}

interface RuleRow {
  id: string;
  template_id: string;
  type_key: string;
  question_count: number;
  difficulty: DifficultyKey | null;
  position: number;
}

interface AttemptRow {
  id: string;
  template_id: string;
  template_version: number;
  template_name: string;
  user_id: string;
  entitlement_id: string | null;
  test_type: TestType;
  module_key: ModuleKey | null;
  difficulty: TemplateDifficulty;
  status: AttemptStatus;
  question_count: number;
  time_limit_minutes: number;
  current_question: number;
  target_score: number | null;
  total_score: number | null;
  created_at: string;
  started_at: string | null;
  submitted_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
}

interface AttemptQuestionRow {
  id: string;
  attempt_id: string;
  position: number;
  question_id: string;
  question_version: number;
  module_key: ModuleKey;
  type_key: string;
  difficulty: DifficultyKey;
  title: string;
  estimated_seconds: number;
}

function createD1TestStore(DB: D1Database): TestStore {
  const run = (sql: string, ...values: unknown[]) => DB.prepare(sql).bind(...values).run();
  const first = <T>(sql: string, ...values: unknown[]) =>
    DB.prepare(sql)
      .bind(...values)
      .first<T>();
  const all = async <T>(sql: string, ...values: unknown[]) =>
    (
      await DB.prepare(sql)
        .bind(...values)
        .all<T>()
    ).results;

  const toTemplate = (row: TemplateRow, rules: RuleRow[]): TestTemplateRecord => ({
    id: row.id,
    name: row.name,
    description: row.description,
    testType: row.test_type,
    module: row.module_key,
    difficulty: row.difficulty,
    price: row.price,
    currency: row.currency,
    questionCount: row.question_count,
    timeLimitMinutes: row.time_limit_minutes,
    targetScore: row.target_score,
    instructions: row.instructions,
    isActive: row.is_active === 1,
    purchasable: row.purchasable === 1,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rules: rules
      .filter((rule) => rule.template_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map((rule) => ({
        id: rule.id,
        typeKey: rule.type_key,
        questionCount: rule.question_count,
        difficulty: rule.difficulty ?? undefined,
        position: rule.position,
      })),
  });

  async function loadTemplates(where: string, values: unknown[]): Promise<TestTemplateRecord[]> {
    const rows = await all<TemplateRow>(
      `SELECT * FROM test_templates ${where} ORDER BY name ASC`,
      ...values,
    );
    if (rows.length === 0) return [];
    const rules = await all<RuleRow>(`SELECT * FROM test_template_rules`);
    return rows.map((row) => toTemplate(row, rules));
  }

  async function writeTemplate(record: TestTemplateRecord, createdBy: string | null) {
    await run(
      `INSERT INTO test_templates (id, slug, name, description, test_type, module_key, difficulty, price, currency,
         question_count, time_limit_minutes, target_score, instructions, is_active, purchasable, version,
         created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, description = excluded.description, test_type = excluded.test_type,
         module_key = excluded.module_key, difficulty = excluded.difficulty, price = excluded.price,
         currency = excluded.currency, question_count = excluded.question_count,
         time_limit_minutes = excluded.time_limit_minutes, target_score = excluded.target_score,
         instructions = excluded.instructions, is_active = excluded.is_active,
         purchasable = excluded.purchasable, version = excluded.version, updated_at = excluded.updated_at`,
      record.id,
      `${slugify(record.name)}-${record.id.slice(-6)}`,
      record.name,
      record.description,
      record.testType,
      record.module,
      record.difficulty,
      record.price,
      record.currency,
      record.questionCount,
      record.timeLimitMinutes,
      record.targetScore,
      record.instructions,
      record.isActive ? 1 : 0,
      record.purchasable ? 1 : 0,
      record.version,
      createdBy,
      record.createdAt,
      record.updatedAt,
    );
    await run(`DELETE FROM test_template_rules WHERE template_id = ?`, record.id);
    for (const rule of record.rules) {
      await run(
        `INSERT INTO test_template_rules (id, template_id, type_key, question_count, difficulty, position, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        rule.id ?? newId("ttr"),
        record.id,
        rule.typeKey,
        rule.questionCount,
        rule.difficulty ?? null,
        rule.position,
        now(),
      );
    }
  }

  const requireTemplate = async (id: string) => {
    const list = await loadTemplates(`WHERE id = ?`, [id]);
    const template = list[0];
    if (!template) throw new Error("Template not found");
    return template;
  };

  const toEntitlement = (row: {
    id: string;
    user_id: string;
    template_id: string;
    status: EntitlementRecord["status"];
    attempt_id: string | null;
    source: string;
    created_at: string;
    expires_at: string | null;
  }): EntitlementRecord => ({
    id: row.id,
    userId: row.user_id,
    templateId: row.template_id,
    status: row.status,
    attemptId: row.attempt_id,
    source: row.source,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  });

  async function loadAttempts(where: string, values: unknown[]): Promise<TestAttemptRecord[]> {
    const rows = await all<AttemptRow>(
      `SELECT * FROM test_attempts ${where} ORDER BY created_at DESC`,
      ...values,
    );
    if (rows.length === 0) return [];
    const questions = await all<AttemptQuestionRow>(
      `SELECT id, attempt_id, position, question_id, question_version, module_key, type_key,
              difficulty, title, estimated_seconds
         FROM attempt_questions WHERE attempt_id IN (${rows.map(() => "?").join(",")})
        ORDER BY position ASC`,
      ...rows.map((row) => row.id),
    );
    const answered = await all<{ attempt_id: string; c: number }>(
      `SELECT attempt_id, COUNT(*) AS c FROM student_answers GROUP BY attempt_id`,
    );
    return rows.map((row) => ({
      id: row.id,
      templateId: row.template_id,
      templateName: row.template_name,
      templateVersion: row.template_version,
      userId: row.user_id,
      module: row.module_key,
      testType: row.test_type,
      difficulty: row.difficulty,
      status: row.status,
      questionCount: row.question_count,
      timeLimitMinutes: row.time_limit_minutes,
      currentQuestion: row.current_question,
      answeredCount: answered.find((entry) => entry.attempt_id === row.id)?.c ?? 0,
      totalScore: row.total_score,
      targetScore: row.target_score,
      entitlementId: row.entitlement_id,
      createdAt: row.created_at,
      startedAt: row.started_at,
      submittedAt: row.submitted_at,
      completedAt: row.completed_at,
      expiresAt: row.expires_at,
      questions: questions
        .filter((question) => question.attempt_id === row.id)
        .map((question) => ({
          id: question.id,
          position: question.position,
          questionId: question.question_id,
          questionVersion: question.question_version,
          module: question.module_key,
          typeKey: question.type_key,
          typeName: questionTypeMap[question.type_key]?.name ?? question.type_key,
          difficulty: question.difficulty,
          title: question.title,
          estimatedSeconds: question.estimated_seconds,
        })),
    }));
  }

  const store: TestStore = {
    kind: "d1",

    async listTemplates(filters) {
      const templates = await loadTemplates("", []);
      return templates.filter((template) => matchesTemplateFilters(template, filters));
    },

    async getTemplate(id) {
      return (await loadTemplates(`WHERE id = ?`, [id]))[0] ?? null;
    },

    async createTemplate(input, userId) {
      const timestamp = now();
      const record = applyTemplateInput(
        {
          id: newId("tpl"),
          name: input.name,
          description: "",
          testType: input.testType,
          module: input.module,
          difficulty: input.difficulty,
          price: input.price,
          currency: input.currency,
          questionCount: 0,
          timeLimitMinutes: input.timeLimitMinutes,
          targetScore: input.targetScore,
          instructions: "",
          isActive: input.isActive,
          purchasable: input.purchasable,
          version: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
          rules: [],
        },
        input,
      );
      await writeTemplate(record, userId);
      return record;
    },

    async updateTemplate(id, input, bumpVersion) {
      const existing = await requireTemplate(id);
      const record = applyTemplateInput(existing, input);
      record.version = bumpVersion ? existing.version + 1 : existing.version;
      await writeTemplate(record, null);
      return record;
    },

    async duplicateTemplate(id, userId) {
      const existing = await requireTemplate(id);
      const timestamp = now();
      const record: TestTemplateRecord = {
        ...existing,
        id: newId("tpl"),
        name: `${existing.name} (copy)`,
        isActive: false,
        purchasable: false,
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        rules: existing.rules.map((rule) => ({ ...rule, id: newId("ttr") })),
      };
      await writeTemplate(record, userId);
      return record;
    },

    async setTemplateActive(id, isActive) {
      await run(
        `UPDATE test_templates SET is_active = ?, purchasable = CASE WHEN ? = 0 THEN 0 ELSE purchasable END, updated_at = ? WHERE id = ?`,
        isActive ? 1 : 0,
        isActive ? 1 : 0,
        now(),
        id,
      );
      return requireTemplate(id);
    },

    async removeTemplate(id) {
      await run(`DELETE FROM test_templates WHERE id = ?`, id);
    },

    async listEntitlements(userId) {
      const rows = await all<Parameters<typeof toEntitlement>[0]>(
        `SELECT * FROM test_entitlements WHERE user_id = ? ORDER BY created_at DESC`,
        userId,
      );
      return rows.map(toEntitlement);
    },

    async getEntitlement(id) {
      const row = await first<Parameters<typeof toEntitlement>[0]>(
        `SELECT * FROM test_entitlements WHERE id = ?`,
        id,
      );
      return row ? toEntitlement(row) : null;
    },

    async findActiveEntitlement(userId, templateId) {
      const row = await first<Parameters<typeof toEntitlement>[0]>(
        `SELECT * FROM test_entitlements WHERE user_id = ? AND template_id = ? AND status = 'active' ORDER BY created_at ASC LIMIT 1`,
        userId,
        templateId,
      );
      return row ? toEntitlement(row) : null;
    },

    async grantEntitlement(userId, templateId, source, price, currency) {
      const id = newId("ent");
      await run(
        `INSERT INTO test_entitlements (id, user_id, template_id, status, attempt_id, source, price_paid, currency, created_at)
         VALUES (?, ?, ?, 'active', NULL, ?, ?, ?, ?)`,
        id,
        userId,
        templateId,
        source,
        price,
        currency,
        now(),
      );
      const record = await store.getEntitlement(id);
      if (!record) throw new Error("Entitlement not created");
      return record;
    },

    async markEntitlementUsed(id, attemptId) {
      await run(
        `UPDATE test_entitlements SET status = 'used', attempt_id = ?, used_at = ? WHERE id = ? AND status = 'active'`,
        attemptId,
        now(),
        id,
      );
    },

    async listAttempts(userId) {
      return userId ? loadAttempts(`WHERE user_id = ?`, [userId]) : loadAttempts("", []);
    },

    async getAttempt(id) {
      return (await loadAttempts(`WHERE id = ?`, [id]))[0] ?? null;
    },

    async createAttempt(attempt, questions) {
      await run(
        `INSERT INTO test_attempts (id, template_id, template_version, template_name, user_id, entitlement_id,
           test_type, module_key, difficulty, status, question_count, time_limit_minutes, current_question,
           target_score, total_score, created_at, started_at, submitted_at, completed_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        attempt.id,
        attempt.templateId,
        attempt.templateVersion,
        attempt.templateName,
        attempt.userId,
        attempt.entitlementId,
        attempt.testType,
        attempt.module,
        attempt.difficulty,
        attempt.status,
        attempt.questionCount,
        attempt.timeLimitMinutes,
        attempt.currentQuestion,
        attempt.targetScore,
        attempt.totalScore,
        attempt.createdAt,
        attempt.startedAt,
        attempt.submittedAt,
        attempt.completedAt,
        attempt.expiresAt,
      );
      for (const question of questions) {
        await run(
          `INSERT INTO attempt_questions (id, attempt_id, position, question_id, question_version, module_key,
             type_key, difficulty, title, estimated_seconds, score_weight, snapshot, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          question.id,
          attempt.id,
          question.position,
          question.questionId,
          question.questionVersion,
          question.module,
          question.typeKey,
          question.difficulty,
          question.title,
          question.estimatedSeconds,
          question.snapshot.scoreWeight,
          JSON.stringify(question.snapshot),
          now(),
        );
      }
      const record = await store.getAttempt(attempt.id);
      if (!record) throw new Error("Attempt not created");
      return record;
    },

    async setAttemptStatus(id, status, patch) {
      await run(
        `UPDATE test_attempts SET status = ?,
           started_at = COALESCE(?, started_at),
           submitted_at = COALESCE(?, submitted_at),
           completed_at = COALESCE(?, completed_at)
         WHERE id = ?`,
        status,
        patch?.startedAt ?? null,
        patch?.submittedAt ?? null,
        patch?.completedAt ?? null,
        id,
      );
      const record = await store.getAttempt(id);
      if (!record) throw new Error("Attempt not found");
      return record;
    },

    async recentQuestionIds(userId, limit) {
      const rows = await all<{ question_id: string }>(
        `SELECT DISTINCT aq.question_id
           FROM attempt_questions aq
           JOIN test_attempts ta ON ta.id = aq.attempt_id
          WHERE ta.user_id = ?
          ORDER BY ta.created_at DESC
          LIMIT ?`,
        userId,
        limit,
      );
      return rows.map((row) => row.question_id);
    },

    async logEvent(attemptId, userId, eventType, metadata) {
      await run(
        `INSERT INTO test_events (id, attempt_id, user_id, event_type, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        newId("evt"),
        attemptId,
        userId,
        eventType,
        JSON.stringify(metadata ?? {}),
        now(),
      );
    },

    async attemptQuestions(attemptId) {
      const rows = await all<AttemptQuestionRow & { snapshot: string }>(
        `SELECT * FROM attempt_questions WHERE attempt_id = ? ORDER BY position ASC`,
        attemptId,
      );
      return rows.map((row) => ({
        id: row.id,
        position: row.position,
        questionId: row.question_id,
        questionVersion: row.question_version,
        module: row.module_key,
        typeKey: row.type_key,
        typeName: questionTypeMap[row.type_key]?.name ?? row.type_key,
        difficulty: row.difficulty,
        title: row.title,
        estimatedSeconds: row.estimated_seconds,
        snapshot: JSON.parse(row.snapshot) as QuestionRecord,
      }));
    },

    async listAnswers(attemptId) {
      const rows = await all<{
        attempt_question_id: string;
        answer_text: string;
        answer_json: string;
        audio_r2_key: string | null;
        time_spent_seconds: number;
        revision_count: number;
        is_final: number;
        updated_at: string;
      }>(`SELECT * FROM student_answers WHERE attempt_id = ?`, attemptId);
      return rows.map((row) => ({
        attemptQuestionId: row.attempt_question_id,
        text: row.answer_text,
        data: { ...emptyData(), ...(JSON.parse(row.answer_json) as Partial<AnswerData>) },
        audioKey: row.audio_r2_key,
        timeSpentSeconds: row.time_spent_seconds,
        revisionCount: row.revision_count,
        isFinal: row.is_final === 1,
        updatedAt: row.updated_at,
      }));
    },

    async saveAnswer(input) {
      const existing = await first<{
        id: string;
        revision_count: number;
        is_final: number;
        audio_r2_key: string | null;
        time_spent_seconds: number;
      }>(`SELECT * FROM student_answers WHERE attempt_question_id = ?`, input.attemptQuestionId);
      const timestamp = now();
      const json = JSON.stringify(input.data);
      const audioKey = input.audioKey ?? existing?.audio_r2_key ?? null;

      if (existing?.is_final === 1) {
        const answers = await store.listAnswers(input.attemptId);
        const found = answers.find((row) => row.attemptQuestionId === input.attemptQuestionId);
        if (found) return found;
      }

      const id = existing?.id ?? newId("ans");
      const revision = (existing?.revision_count ?? 0) + 1;
      const timeSpent = Math.max(input.timeSpentSeconds, existing?.time_spent_seconds ?? 0);

      if (existing) {
        await run(
          `UPDATE student_answers SET answer_text = ?, answer_json = ?, audio_r2_key = ?,
             time_spent_seconds = ?, revision_count = ?, updated_at = ? WHERE id = ?`,
          input.text,
          json,
          audioKey,
          timeSpent,
          revision,
          timestamp,
          id,
        );
      } else {
        await run(
          `INSERT INTO student_answers (id, attempt_id, attempt_question_id, user_id, answer_text,
             answer_json, audio_r2_key, time_spent_seconds, revision_count, is_final, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
          id,
          input.attemptId,
          input.attemptQuestionId,
          input.userId,
          input.text,
          json,
          audioKey,
          timeSpent,
          revision,
          timestamp,
          timestamp,
        );
      }

      // Append-only revision history for every saved change.
      await run(
        `INSERT INTO answer_revisions (id, answer_id, revision_number, answer_text, answer_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        newId("rev"),
        id,
        revision,
        input.text,
        json,
        timestamp,
      );

      return {
        attemptQuestionId: input.attemptQuestionId,
        text: input.text,
        data: input.data,
        audioKey,
        timeSpentSeconds: timeSpent,
        revisionCount: revision,
        isFinal: false,
        updatedAt: timestamp,
      };
    },

    async finalizeAnswers(attemptId) {
      await run(`UPDATE student_answers SET is_final = 1 WHERE attempt_id = ?`, attemptId);
    },

    async setCurrentQuestion(attemptId, position) {
      await run(`UPDATE test_attempts SET current_question = ? WHERE id = ?`, position, attemptId);
    },
  };

  return store;
}

export function getTestStore(env: WorkerEnv): TestStore {
  return env.DB ? createD1TestStore(env.DB) : createMemoryTestStore();
}

export function getStores(env: WorkerEnv): { tests: TestStore; questions: QuestionStore } {
  return { tests: getTestStore(env), questions: getQuestionStore(env) };
}

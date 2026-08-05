/**
 * Admin question-bank endpoints.
 *
 * Every action requires an authenticated user holding the `admin` role and a
 * valid CSRF token for writes. Dispatched from
 * src/routes/api/public/questions/$action.ts.
 */
import { z } from "zod";

import {
  difficultyKeys,
  moduleKeys,
  questionStatuses,
  questionTypeMap,
  questionTypes,
  type QuestionSort,
} from "@/config/questions";
import { audit, createContext, requireRole, type AuthContext } from "./auth.server";
import { HttpError, assertCsrf, errorResponse, json, parseBody } from "./http.server";
import {
  getQuestionStore,
  toWriteInput,
  type QuestionFilters,
  type QuestionStore,
  type QuestionWriteInput,
} from "./questions.server";

/* --------------------------------- schemas -------------------------------- */

const optionSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().max(8).default(""),
  content: z.string().trim().min(1, "Option text is required.").max(2000),
  isCorrect: z.boolean().default(false),
  position: z.number().int().min(0).default(0),
});

const blankSchema = z.object({
  index: z.number().int().min(1),
  answer: z.string().trim().min(1, "Each blank needs a correct answer.").max(200),
  choices: z.array(z.string().trim().max(200)).max(12).default([]),
});

const orderingSchema = z.object({
  key: z.string().trim().min(1).max(40),
  content: z.string().trim().min(1, "Each block needs text.").max(2000),
  correctPosition: z.number().int().min(1).max(20),
});

const contentSchema = z
  .object({
    blanks: z.array(blankSchema).max(20).optional(),
    wordBank: z.array(z.string().trim().max(200)).max(40).optional(),
    ordering: z.array(orderingSchema).max(20).optional(),
    incorrectWords: z.array(z.string().trim().max(80)).max(30).optional(),
    wordLimit: z.object({ min: z.number().int().min(0), max: z.number().int().min(1) }).optional(),
    preparationSeconds: z.number().int().min(0).max(600).optional(),
    recordingSeconds: z.number().int().min(0).max(600).optional(),
  })
  .default({});

const writeSchema = z.object({
  module: z.enum(moduleKeys as [string, ...string[]]),
  type: z.string().trim().min(1, "Select a question type."),
  difficulty: z.enum(difficultyKeys as [string, ...string[]]),
  title: z.string().trim().min(3, "Give the question a title.").max(160),
  instructions: z.string().trim().max(1000).default(""),
  prompt: z.string().trim().max(4000).default(""),
  passage: z.string().trim().max(20000).default(""),
  correctAnswer: z.string().trim().max(4000).default(""),
  alternativeAnswers: z.array(z.string().trim().max(1000)).max(20).default([]),
  modelAnswer: z.string().trim().max(8000).default(""),
  explanation: z.string().trim().max(4000).default(""),
  scoringConfig: z.record(z.unknown()).default({}),
  scoreWeight: z.number().min(0).max(20).default(1),
  topic: z.string().trim().max(80).default(""),
  tags: z.array(z.string().trim().max(40)).max(20).default([]),
  estimatedSeconds: z.number().int().min(5).max(3600).default(60),
  sourceReference: z.string().trim().max(300).default(""),
  adminNotes: z.string().trim().max(2000).default(""),
  aiConfidence: z.number().min(0).max(1).nullable().default(null),
  content: contentSchema,
  options: z.array(optionSchema).max(12).default([]),
  audio: z
    .object({
      url: z.string().trim().url("Enter a valid audio URL.").max(500),
      transcript: z.string().trim().max(8000).default(""),
      durationSeconds: z.number().min(0).max(1800).nullable().default(null),
    })
    .nullable()
    .default(null),
  image: z
    .object({
      url: z.string().trim().url("Enter a valid image URL.").max(500),
      altText: z.string().trim().max(300).default(""),
    })
    .nullable()
    .default(null),
});

const createSchema = z.object({ question: writeSchema });
const updateSchema = z.object({
  id: z.string().trim().min(3),
  question: writeSchema,
  changeNote: z.string().trim().max(300).default(""),
});
const idSchema = z.object({ id: z.string().trim().min(3) });
const statusSchema = z.object({
  id: z.string().trim().min(3),
  action: z.enum([
    "submit_review",
    "approve",
    "return_draft",
    "publish",
    "unpublish",
    "archive",
    "restore",
  ]),
  comment: z.string().trim().max(500).default(""),
});
const bulkSchema = z.object({
  ids: z.array(z.string().trim().min(3)).min(1, "Select at least one question.").max(200),
  action: z.enum(["publish", "archive", "set_difficulty", "add_tags", "delete"]),
  difficulty: z.enum(difficultyKeys as [string, ...string[]]).optional(),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
});
const versionSchema = z.object({
  id: z.string().trim().min(3),
  versionNumber: z.number().int().min(1),
});

/** Type-specific requirements enforced server-side, not just in the form. */
function validateAgainstType(input: QuestionWriteInput): void {
  const def = questionTypeMap[input.type];
  if (!def) throw new HttpError(400, "Unknown question type.", { type: "Select a question type." });
  if (def.module !== input.module) {
    throw new HttpError(400, "Please check the highlighted fields.", {
      type: `${def.name} belongs to the ${def.module} module.`,
    });
  }
  const cap = def.capabilities;
  const fields: Record<string, string> = {};

  if (cap.options) {
    if (input.options.length < 2) fields["options"] = "Add at least two options.";
    const correct = input.options.filter((o) => o.isCorrect).length;
    if (correct === 0) fields["options"] = "Mark at least one option as correct.";
    if (cap.options === "single" && correct > 1)
      fields["options"] = "This task type allows exactly one correct option.";
  }
  if (cap.ordering && (input.content.ordering?.length ?? 0) < 2)
    fields["ordering"] = "Add at least two text blocks.";
  if (cap.blanks && (input.content.blanks?.length ?? 0) < 1)
    fields["blanks"] = "Add at least one blank with its correct answer.";
  if (cap.audio && !input.audio) fields["audio"] = "This task type requires an audio asset.";
  if (cap.image && !input.image) fields["image"] = "This task type requires an image asset.";
  if (cap.transcript && input.audio && input.audio.transcript.trim().length === 0)
    fields["transcript"] = "Add the expected transcript of the audio.";
  if (cap.passage && input.passage.trim().length === 0)
    fields["passage"] = "Add the passage or transcript shown to the student.";
  if (cap.writtenResponse && !input.content.wordLimit)
    fields["wordLimit"] = "Set the minimum and maximum word count.";

  if (Object.keys(fields).length > 0)
    throw new HttpError(400, "Please check the highlighted fields.", fields);
}

function toWrite(parsed: z.infer<typeof writeSchema>): QuestionWriteInput {
  return parsed as unknown as QuestionWriteInput;
}

function filtersFromUrl(request: Request): QuestionFilters {
  const url = new URL(request.url);
  const q = (key: string) => url.searchParams.get(key) ?? undefined;
  const num = (key: string) => {
    const raw = q(key);
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : undefined;
  };
  return {
    search: q("search"),
    module: q("module") as QuestionFilters["module"],
    type: q("type"),
    difficulty: q("difficulty") as QuestionFilters["difficulty"],
    status: q("status") as QuestionFilters["status"],
    topic: q("topic"),
    createdFrom: q("createdFrom"),
    createdTo: q("createdTo"),
    sort: q("sort") as QuestionSort | undefined,
    page: num("page"),
    pageSize: num("pageSize"),
  };
}

const statusForAction: Record<string, (typeof questionStatuses)[number]> = {
  submit_review: "under_review",
  approve: "approved",
  return_draft: "draft",
  publish: "published",
  unpublish: "approved",
  archive: "archived",
  restore: "draft",
};

type Ctx = AuthContext & { questions: QuestionStore };

type Handler = (request: Request, ctx: Ctx, adminId: string) => Promise<Response>;

const handlers: Record<string, { method: "GET" | "POST"; handler: Handler }> = {
  catalog: {
    method: "GET",
    handler: async (_request, ctx) => {
      const list = await ctx.questions.list({ pageSize: 100 });
      return json({
        modules: moduleKeys,
        difficulties: difficultyKeys,
        statuses: questionStatuses,
        types: questionTypes.map(({ key, module, name, capabilities, estimatedSeconds }) => ({
          key,
          module,
          name,
          capabilities,
          estimatedSeconds,
        })),
        topics: list.topics,
        tags: list.tags,
        storage: ctx.questions.kind,
      });
    },
  },

  list: {
    method: "GET",
    handler: async (request, ctx) => {
      const result = await ctx.questions.list(filtersFromUrl(request));
      return json(result);
    },
  },

  get: {
    method: "GET",
    handler: async (request, ctx) => {
      const id = new URL(request.url).searchParams.get("id") ?? "";
      const question = await ctx.questions.get(id);
      if (!question) throw new HttpError(404, "Question not found.");
      const versions = await ctx.questions.versions(id);
      return json({ question, versions });
    },
  },

  versions: {
    method: "GET",
    handler: async (request, ctx) => {
      const url = new URL(request.url);
      const id = url.searchParams.get("id") ?? "";
      const versionNumber = Number(url.searchParams.get("versionNumber") ?? "");
      if (Number.isFinite(versionNumber) && versionNumber > 0) {
        const snapshot = await ctx.questions.version(id, versionNumber);
        if (!snapshot) throw new HttpError(404, "Version not found.");
        return json({ snapshot });
      }
      return json({ versions: await ctx.questions.versions(id) });
    },
  },

  create: {
    method: "POST",
    handler: async (request, ctx, adminId) => {
      assertCsrf(request);
      const data = await parseBody(request, createSchema);
      const input = toWrite(data.question);
      validateAgainstType(input);
      const question = await ctx.questions.create(input, adminId, "draft");
      await audit(ctx, request, {
        userId: adminId,
        action: "question.create",
        outcome: "success",
        metadata: { questionId: question.id, type: question.type },
      });
      return json({ question }, { status: 201 });
    },
  },

  update: {
    method: "POST",
    handler: async (request, ctx, adminId) => {
      assertCsrf(request);
      const data = await parseBody(request, updateSchema);
      const input = toWrite(data.question);
      validateAgainstType(input);
      const existing = await ctx.questions.get(data.id);
      if (!existing) throw new HttpError(404, "Question not found.");
      const question = await ctx.questions.update(data.id, input, adminId, data.changeNote);
      await audit(ctx, request, {
        userId: adminId,
        action: "question.update",
        outcome: "success",
        metadata: { questionId: question.id, version: question.version },
      });
      return json({ question });
    },
  },

  duplicate: {
    method: "POST",
    handler: async (request, ctx, adminId) => {
      assertCsrf(request);
      const data = await parseBody(request, idSchema);
      const question = await ctx.questions.duplicate(data.id, adminId);
      await audit(ctx, request, {
        userId: adminId,
        action: "question.duplicate",
        outcome: "success",
        metadata: { sourceId: data.id, questionId: question.id },
      });
      return json({ question }, { status: 201 });
    },
  },

  status: {
    method: "POST",
    handler: async (request, ctx, adminId) => {
      assertCsrf(request);
      const data = await parseBody(request, statusSchema);
      const target = statusForAction[data.action]!;
      const question = await ctx.questions.setStatus(
        data.id,
        target,
        adminId,
        data.action,
        data.comment,
      );
      await audit(ctx, request, {
        userId: adminId,
        action: `question.${data.action}`,
        outcome: "success",
        metadata: { questionId: data.id, status: target },
      });
      return json({ question });
    },
  },

  "restore-version": {
    method: "POST",
    handler: async (request, ctx, adminId) => {
      assertCsrf(request);
      const data = await parseBody(request, versionSchema);
      const question = await ctx.questions.restoreVersion(data.id, data.versionNumber, adminId);
      await audit(ctx, request, {
        userId: adminId,
        action: "question.restore_version",
        outcome: "success",
        metadata: { questionId: data.id, versionNumber: data.versionNumber },
      });
      return json({ question });
    },
  },

  delete: {
    method: "POST",
    handler: async (request, ctx, adminId) => {
      assertCsrf(request);
      const data = await parseBody(request, idSchema);
      const existing = await ctx.questions.get(data.id);
      if (!existing) throw new HttpError(404, "Question not found.");
      await ctx.questions.remove(data.id);
      await audit(ctx, request, {
        userId: adminId,
        action: "question.delete",
        outcome: "success",
        metadata: { questionId: data.id, title: existing.title },
      });
      return json({ ok: true });
    },
  },

  bulk: {
    method: "POST",
    handler: async (request, ctx, adminId) => {
      assertCsrf(request);
      const data = await parseBody(request, bulkSchema);
      let affected = 0;
      for (const id of data.ids) {
        const existing = await ctx.questions.get(id);
        if (!existing) continue;
        switch (data.action) {
          case "publish":
            await ctx.questions.setStatus(id, "published", adminId, "publish", "Bulk publish");
            break;
          case "archive":
            await ctx.questions.setStatus(id, "archived", adminId, "archive", "Bulk archive");
            break;
          case "set_difficulty":
            if (!data.difficulty)
              throw new HttpError(400, "Choose a difficulty level.", {
                difficulty: "Required for this bulk action.",
              });
            await ctx.questions.setDifficulty(id, data.difficulty as never);
            break;
          case "add_tags":
            if (!data.tags || data.tags.length === 0)
              throw new HttpError(400, "Add at least one tag.", { tags: "Required." });
            await ctx.questions.addTags(id, data.tags);
            break;
          case "delete":
            await ctx.questions.remove(id);
            break;
        }
        affected += 1;
      }
      await audit(ctx, request, {
        userId: adminId,
        action: `question.bulk_${data.action}`,
        outcome: "success",
        metadata: { count: affected },
      });
      return json({ ok: true, affected });
    },
  },
};

export async function handleQuestionRequest(request: Request, action: string): Promise<Response> {
  try {
    const entry = handlers[action];
    if (!entry) return json({ error: "Unknown endpoint." }, { status: 404 });
    if (entry.method !== request.method) {
      return json({ error: "Method not allowed." }, { status: 405 });
    }
    const base = await createContext();
    const admin = await requireRole(base, request, "admin");
    const ctx: Ctx = { ...base, questions: getQuestionStore(base.env) };
    return await entry.handler(request, ctx, admin.id);
  } catch (error) {
    return errorResponse(error);
  }
}

export { toWriteInput };

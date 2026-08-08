/**
 * Test template, generation and attempt endpoints.
 *
 * Admin actions require the `admin` role; student actions require an
 * authenticated session. Writes require a CSRF token. Dispatched from
 * src/routes/api/public/tests/$action.ts.
 */
import { z } from "zod";

import { difficultyKeys, moduleKeys, questionTypeMap } from "@/config/questions";
import {
  attemptStatuses,
  estimatedMinutes,
  templateDifficulties,
  testTypes,
  type AttemptStatus,
  type TestAttemptRecord,
  type TestTemplateRecord,
} from "@/config/tests";
import { pricingConfig } from "@/config/site";
import { audit, createContext, requireRole, requireUser, type AuthContext } from "./auth.server";
import { HttpError, assertCsrf, errorResponse, json, parseBody } from "./http.server";
import { getQuestionStore, type QuestionStore } from "./questions.server";
import {
  generateTest,
  getTestStore,
  templateToInput,
  toAttemptQuestions,
  validateTemplate,
  type TemplateWriteInput,
  type TestStore,
} from "./tests.server";
import {
  assertEditable,
  attemptDeadline,
  buildReview,
  buildSession,
  getMediaObject,
  normaliseAnswer,
  putResponseAudio,
  questionMediaKey,
  requireAttemptQuestion,
  responseAudioKey,
} from "./attempts.server";
import { newId } from "./crypto.server";

/* ------------------------------ runner schemas ----------------------------- */

const answerDataSchema = z.object({
  selections: z.array(z.string().max(120)).max(20).default([]),
  blanks: z.record(z.string(), z.string().max(200)).default({}),
  ordering: z.array(z.string().max(60)).max(20).default([]),
  highlighted: z.array(z.number().int().min(0).max(5000)).max(200).default([]),
  flagged: z.boolean().default(false),
});

const saveAnswerSchema = z.object({
  attemptId: z.string().trim().min(3),
  attemptQuestionId: z.string().trim().min(3),
  text: z.string().max(20000).default(""),
  data: answerDataSchema,
  timeSpentSeconds: z.number().int().min(0).max(100000).default(0),
  currentQuestion: z.number().int().min(1).max(200).optional(),
});

const submitSchema = z.object({
  attemptId: z.string().trim().min(3),
  reason: z.enum(["manual", "time_expired"]).default("manual"),
});

/* --------------------------------- schemas -------------------------------- */

const ruleSchema = z.object({
  typeKey: z.string().trim().min(1),
  questionCount: z.number().int().min(0).max(60),
  difficulty: z.enum(difficultyKeys as [string, ...string[]]).optional(),
});

const templateSchema = z.object({
  name: z.string().trim().min(3, "Give the template a name.").max(120),
  description: z.string().trim().max(2000).default(""),
  testType: z.enum(testTypes as unknown as [string, ...string[]]),
  module: z.enum(moduleKeys as [string, ...string[]]).nullable().default(null),
  difficulty: z.enum(templateDifficulties as unknown as [string, ...string[]]),
  price: z.number().min(0).max(999),
  currency: z.string().trim().min(3).max(3).default(pricingConfig.currency),
  timeLimitMinutes: z.number().int().min(1).max(400),
  targetScore: z.number().int().min(0).max(90).nullable().default(null),
  instructions: z.string().trim().max(2000).default(""),
  isActive: z.boolean().default(true),
  purchasable: z.boolean().default(true),
  rules: z.array(ruleSchema).min(1, "Add at least one question type.").max(30),
});

const createSchema = z.object({ template: templateSchema });
const updateSchema = z.object({
  id: z.string().trim().min(3),
  template: templateSchema,
  bumpVersion: z.boolean().default(false),
});
const idSchema = z.object({ id: z.string().trim().min(3) });
const activateSchema = z.object({ id: z.string().trim().min(3), isActive: z.boolean() });
const startSchema = z.object({
  templateId: z.string().trim().min(3),
  entitlementId: z.string().trim().min(3).optional(),
});
const attemptStatusSchema = z.object({
  id: z.string().trim().min(3),
  status: z.enum(attemptStatuses as unknown as [string, ...string[]]),
});

/** Template rules must belong to the template's module and to real task types. */
function validateInput(input: TemplateWriteInput): void {
  const fields: Record<string, string> = {};
  if (input.testType !== "mock" && !input.module)
    fields["module"] = "Choose a module for this test type.";
  if (input.testType === "module" && input.difficulty === "mixed")
    fields["difficulty"] =
      "Mixed difficulty is only available for complete mock tests and practice sets.";
  for (const rule of input.rules) {
    const def = questionTypeMap[rule.typeKey];
    if (!def) {
      fields["rules"] = `Unknown question type: ${rule.typeKey}.`;
      continue;
    }
    if (input.testType !== "mock" && input.module && def.module !== input.module)
      fields["rules"] = `${def.name} belongs to the ${def.module} module.`;
  }
  if (input.rules.every((rule) => rule.questionCount === 0))
    fields["rules"] = "Set at least one question count above zero.";
  if (Object.keys(fields).length > 0)
    throw new HttpError(400, "Please check the highlighted fields.", fields);
}

type Ctx = AuthContext & { tests: TestStore; questions: QuestionStore };

async function requireTemplate(ctx: Ctx, id: string): Promise<TestTemplateRecord> {
  const template = await ctx.tests.getTemplate(id);
  if (!template) throw new HttpError(404, "Test template not found.");
  return template;
}

type Handler = (request: Request, ctx: Ctx, userId: string) => Promise<Response>;

const handlers: Record<
  string,
  { method: "GET" | "POST"; role: "admin" | "user"; handler: Handler }
> = {
  /* ------------------------------- admin ------------------------------- */

  templates: {
    method: "GET",
    role: "admin",
    handler: async (request, ctx) => {
      const url = new URL(request.url);
      const templates = await ctx.tests.listTemplates({
        testType: (url.searchParams.get("testType") ?? "all") as never,
        module: (url.searchParams.get("module") ?? "all") as never,
        difficulty: (url.searchParams.get("difficulty") ?? "all") as never,
      });
      const pool = (await ctx.questions.list({ status: "published", pageSize: 1000 })).rows;
      const validations = await Promise.all(
        templates.map((template) => validateTemplate(ctx.questions, template, pool)),
      );
      return json({ templates, validations, storage: ctx.tests.kind });
    },
  },

  template: {
    method: "GET",
    role: "admin",
    handler: async (request, ctx) => {
      const template = await requireTemplate(ctx, new URL(request.url).searchParams.get("id") ?? "");
      const validation = await validateTemplate(ctx.questions, template);
      return json({ template, validation });
    },
  },

  "template-create": {
    method: "POST",
    role: "admin",
    handler: async (request, ctx, adminId) => {
      assertCsrf(request);
      const data = await parseBody(request, createSchema);
      const input = data.template as unknown as TemplateWriteInput;
      validateInput(input);
      const template = await ctx.tests.createTemplate(input, adminId);
      await audit(ctx, request, {
        userId: adminId,
        action: "test_template.create",
        outcome: "success",
        metadata: { templateId: template.id },
      });
      return json({ template });
    },
  },

  "template-update": {
    method: "POST",
    role: "admin",
    handler: async (request, ctx, adminId) => {
      assertCsrf(request);
      const data = await parseBody(request, updateSchema);
      const input = data.template as unknown as TemplateWriteInput;
      validateInput(input);
      await requireTemplate(ctx, data.id);
      const template = await ctx.tests.updateTemplate(data.id, input, data.bumpVersion);
      await audit(ctx, request, {
        userId: adminId,
        action: "test_template.update",
        outcome: "success",
        metadata: { templateId: template.id, version: template.version },
      });
      return json({ template });
    },
  },

  "template-duplicate": {
    method: "POST",
    role: "admin",
    handler: async (request, ctx, adminId) => {
      assertCsrf(request);
      const data = await parseBody(request, idSchema);
      await requireTemplate(ctx, data.id);
      const template = await ctx.tests.duplicateTemplate(data.id, adminId);
      return json({ template });
    },
  },

  "template-activate": {
    method: "POST",
    role: "admin",
    handler: async (request, ctx, adminId) => {
      assertCsrf(request);
      const data = await parseBody(request, activateSchema);
      const existing = await requireTemplate(ctx, data.id);
      if (data.isActive) {
        const validation = await validateTemplate(ctx.questions, existing);
        if (validation.rules.some((rule) => rule.shortfall > 0)) {
          throw new HttpError(
            400,
            "The question bank cannot fill this template yet. Resolve the warnings before activating.",
            { rules: validation.warnings[0] ?? "Not enough published questions." },
          );
        }
      }
      const template = await ctx.tests.setTemplateActive(data.id, data.isActive);
      await audit(ctx, request, {
        userId: adminId,
        action: data.isActive ? "test_template.activate" : "test_template.deactivate",
        outcome: "success",
        metadata: { templateId: template.id },
      });
      return json({ template });
    },
  },

  "template-delete": {
    method: "POST",
    role: "admin",
    handler: async (request, ctx, adminId) => {
      assertCsrf(request);
      const data = await parseBody(request, idSchema);
      await requireTemplate(ctx, data.id);
      await ctx.tests.removeTemplate(data.id);
      await audit(ctx, request, {
        userId: adminId,
        action: "test_template.delete",
        outcome: "success",
        metadata: { templateId: data.id },
      });
      return json({ ok: true });
    },
  },

  "template-validate": {
    method: "GET",
    role: "admin",
    handler: async (request, ctx) => {
      const template = await requireTemplate(ctx, new URL(request.url).searchParams.get("id") ?? "");
      return json({ validation: await validateTemplate(ctx.questions, template) });
    },
  },

  /** Simulated generation — never creates a student attempt. */
  "generate-preview": {
    method: "GET",
    role: "admin",
    handler: async (request, ctx) => {
      const template = await requireTemplate(ctx, new URL(request.url).searchParams.get("id") ?? "");
      const result = await generateTest(ctx.questions, template);
      return json({
        template,
        ok: result.ok,
        warnings: result.warnings,
        shortfalls: result.shortfalls,
        questions: result.questions.map((question, index) => ({
          position: index + 1,
          id: question.id,
          module: question.module,
          typeKey: question.type,
          typeName: questionTypeMap[question.type]?.name ?? question.type,
          difficulty: question.difficulty,
          title: question.title,
          estimatedSeconds: question.estimatedSeconds,
          version: question.version,
        })),
      });
    },
  },

  /* ------------------------------ students ----------------------------- */

  catalogue: {
    method: "GET",
    role: "user",
    handler: async (_request, ctx, userId) => {
      const templates = await ctx.tests.listTemplates({ activeOnly: true });
      const entitlements = await ctx.tests.listEntitlements(userId);
      const attempts = await ctx.tests.listAttempts(userId);
      return json({
        templates: templates.map((template) => ({
          ...template,
          estimatedMinutes: estimatedMinutes(template.rules),
          types: template.rules.map((rule) => ({
            typeKey: rule.typeKey,
            typeName: questionTypeMap[rule.typeKey]?.name ?? rule.typeKey,
            questionCount: rule.questionCount,
          })),
        })),
        entitlements,
        attempts,
      });
    },
  },

  "my-tests": {
    method: "GET",
    role: "user",
    handler: async (_request, ctx, userId) => {
      const attempts = await ctx.tests.listAttempts(userId);
      const entitlements = await ctx.tests.listEntitlements(userId);
      const templates = await ctx.tests.listTemplates({});
      return json({ attempts, entitlements, templates });
    },
  },

  /**
   * Grants an entitlement. Payments are not implemented yet, so this records a
   * zero-price entitlement instead of charging; the generation flow is
   * unchanged once a payment provider is connected.
   */
  entitle: {
    method: "POST",
    role: "user",
    handler: async (request, ctx, userId) => {
      assertCsrf(request);
      const data = await parseBody(request, idSchema);
      const template = await requireTemplate(ctx, data.id);
      if (!template.isActive || !template.purchasable)
        throw new HttpError(400, "This test is not available right now.");
      const existing = await ctx.tests.findActiveEntitlement(userId, template.id);
      if (existing) return json({ entitlement: existing, reused: true });
      const entitlement = await ctx.tests.grantEntitlement(
        userId,
        template.id,
        "manual",
        0,
        template.currency,
      );
      return json({ entitlement, reused: false });
    },
  },

  /** Generates the attempt: entitlement check → snapshot → mark used. */
  start: {
    method: "POST",
    role: "user",
    handler: async (request, ctx, userId) => {
      assertCsrf(request);
      const data = await parseBody(request, startSchema);
      const template = await requireTemplate(ctx, data.templateId);
      if (!template.isActive) throw new HttpError(400, "This test is not available right now.");

      const entitlement = data.entitlementId
        ? await ctx.tests.getEntitlement(data.entitlementId)
        : await ctx.tests.findActiveEntitlement(userId, template.id);
      if (!entitlement || entitlement.userId !== userId || entitlement.templateId !== template.id)
        throw new HttpError(403, "You do not have an entitlement for this test yet.");
      // One entitlement can only ever create one attempt.
      if (entitlement.status !== "active" || entitlement.attemptId)
        throw new HttpError(409, "This entitlement has already been used for a test.");

      const recent = await ctx.tests.recentQuestionIds(userId, 200);
      const result = await generateTest(ctx.questions, template, { recentQuestionIds: recent });
      if (!result.ok) {
        throw new HttpError(
          409,
          "This test cannot be generated yet — the question bank does not have enough published questions.",
          { rules: result.warnings.join(" ") },
        );
      }

      const questions = toAttemptQuestions(result.questions);
      const timestamp = new Date();
      const attempt = await ctx.tests.createAttempt(
        {
          id: newId("att"),
          templateId: template.id,
          templateName: template.name,
          templateVersion: template.version,
          userId,
          module: template.module,
          testType: template.testType,
          difficulty: template.difficulty,
          status: "in_progress",
          questionCount: questions.length,
          timeLimitMinutes: template.timeLimitMinutes,
          currentQuestion: 1,
          answeredCount: 0,
          totalScore: null,
          targetScore: template.targetScore,
          entitlementId: entitlement.id,
          createdAt: timestamp.toISOString(),
          startedAt: timestamp.toISOString(),
          submittedAt: null,
          completedAt: null,
          expiresAt: new Date(
            timestamp.getTime() + (template.timeLimitMinutes + 60) * 60 * 1000,
          ).toISOString(),
        },
        questions,
      );
      await ctx.tests.markEntitlementUsed(entitlement.id, attempt.id);
      await ctx.tests.logEvent(attempt.id, userId, "attempt.generated", {
        templateId: template.id,
        questionCount: questions.length,
      });
      await ctx.tests.logEvent(attempt.id, userId, "attempt.started", {});
      await audit(ctx, request, {
        userId,
        action: "test_attempt.start",
        outcome: "success",
        metadata: { attemptId: attempt.id, templateId: template.id },
      });
      return json({ attempt, warnings: result.warnings });
    },
  },

  attempt: {
    method: "GET",
    role: "user",
    handler: async (request, ctx, userId) => {
      const attempt = await ctx.tests.getAttempt(
        new URL(request.url).searchParams.get("id") ?? "",
      );
      if (!attempt || attempt.userId !== userId) throw new HttpError(404, "Test attempt not found.");
      return json({ attempt });
    },
  },

  "attempt-status": {
    method: "POST",
    role: "user",
    handler: async (request, ctx, userId) => {
      assertCsrf(request);
      const data = await parseBody(request, attemptStatusSchema);
      const attempt = await ctx.tests.getAttempt(data.id);
      if (!attempt || attempt.userId !== userId) throw new HttpError(404, "Test attempt not found.");
      const status = data.status as AttemptStatus;
      const allowed: Record<string, AttemptStatus[]> = {
        ready: ["in_progress", "cancelled"],
        purchased: ["in_progress", "cancelled"],
        in_progress: ["paused", "submitted", "expired"],
        paused: ["in_progress", "expired"],
        submitted: ["scoring"],
        scoring: ["completed"],
      };
      if (!(allowed[attempt.status] ?? []).includes(status))
        throw new HttpError(409, `Cannot move this test from ${attempt.status} to ${status}.`);
      const timestamp = new Date().toISOString();
      const updated = await ctx.tests.setAttemptStatus(data.id, status, {
        ...(status === "in_progress" && !attempt.startedAt ? { startedAt: timestamp } : {}),
        ...(status === "submitted" ? { submittedAt: timestamp } : {}),
        ...(status === "completed" ? { completedAt: timestamp } : {}),
      });
      await ctx.tests.logEvent(data.id, userId, `attempt.${status}`, {});
      return json({ attempt: updated });
    },
  },
  /* ----------------------------- test runner ------------------------------ */

  /** Sanitised session payload: questions, saved answers, deadline. */
  "runner-session": {
    method: "GET",
    role: "user",
    handler: async (request, ctx, userId) => {
      const attempt = await requireOwnAttempt(ctx, request, userId);
      const template = await ctx.tests.getTemplate(attempt.templateId);
      const live = await expireIfOverdue(ctx, attempt, userId);
      const session = await buildSession(ctx.tests, live, template?.instructions ?? "");
      return json({ session });
    },
  },

  "save-answer": {
    method: "POST",
    role: "user",
    handler: async (request, ctx, userId) => {
      assertCsrf(request);
      const data = await parseBody(request, saveAnswerSchema);
      const attempt = await requireOwnAttemptId(ctx, data.attemptId, userId);
      const live = await expireIfOverdue(ctx, attempt, userId);
      assertEditable(live);
      const row = await requireAttemptQuestion(ctx.tests, live, data.attemptQuestionId);
      const normalised = normaliseAnswer(row.typeKey, data);
      const saved = await ctx.tests.saveAnswer({
        attemptId: live.id,
        attemptQuestionId: row.id,
        userId,
        text: normalised.text,
        data: normalised.data,
        timeSpentSeconds: data.timeSpentSeconds,
      });
      if (data.currentQuestion) await ctx.tests.setCurrentQuestion(live.id, data.currentQuestion);
      await ctx.tests.logEvent(live.id, userId, "answer.autosave", {
        attemptQuestionId: row.id,
        revision: saved.revisionCount,
      });
      return json({ savedAt: saved.updatedAt, revisionCount: saved.revisionCount });
    },
  },

  /** Upload a spoken response to R2 and attach its key to the answer. */
  "upload-audio": {
    method: "POST",
    role: "user",
    handler: async (request, ctx, userId) => {
      assertCsrf(request);
      const url = new URL(request.url);
      const attemptId = url.searchParams.get("attemptId") ?? "";
      const attemptQuestionId = url.searchParams.get("attemptQuestionId") ?? "";
      const attempt = await requireOwnAttemptId(ctx, attemptId, userId);
      const live = await expireIfOverdue(ctx, attempt, userId);
      assertEditable(live);
      const row = await requireAttemptQuestion(ctx.tests, live, attemptQuestionId);
      if (!questionTypeMap[row.typeKey]?.capabilities.spokenResponse)
        throw new HttpError(400, "This question does not accept a recording.");

      const body = await request.arrayBuffer();
      if (body.byteLength === 0) throw new HttpError(400, "The recording was empty.");
      if (body.byteLength > 8 * 1024 * 1024)
        throw new HttpError(413, "That recording is too large.");

      const key = responseAudioKey(live.id, row.id);
      await putResponseAudio(key, body, request.headers.get("content-type") ?? "audio/webm");
      const existing = (await ctx.tests.listAnswers(live.id)).find(
        (answer) => answer.attemptQuestionId === row.id,
      );
      const saved = await ctx.tests.saveAnswer({
        attemptId: live.id,
        attemptQuestionId: row.id,
        userId,
        text: "",
        data: existing?.data ?? normaliseAnswer(row.typeKey, {}).data,
        audioKey: key,
        timeSpentSeconds: existing?.timeSpentSeconds ?? 0,
      });
      await ctx.tests.logEvent(live.id, userId, "answer.audio_uploaded", {
        attemptQuestionId: row.id,
        bytes: body.byteLength,
      });
      return json({ audioKey: key, savedAt: saved.updatedAt });
    },
  },

  /** Protected media streaming for question audio/images. */
  media: {
    method: "GET",
    role: "user",
    handler: async (request, ctx, userId) => {
      const url = new URL(request.url);
      const attemptQuestionId = url.searchParams.get("aq") ?? "";
      const kind = url.searchParams.get("kind") === "image" ? "image" : "audio";
      const attempts = await ctx.tests.listAttempts(userId);
      for (const attempt of attempts) {
        const rows = await ctx.tests.attemptQuestions(attempt.id);
        const row = rows.find((entry) => entry.id === attemptQuestionId);
        if (!row) continue;
        const asset = kind === "audio" ? row.snapshot.audio : row.snapshot.image;
        if (!asset) throw new HttpError(404, "Media not found.");
        const object = await getMediaObject(questionMediaKey(row.snapshot, kind));
        if (object) {
          return new Response(object.body, {
            headers: {
              "content-type": object.contentType,
              "cache-control": "private, max-age=3600",
            },
          });
        }
        // Seeded content still lives at its source URL; redirect rather than 404.
        return new Response(null, { status: 302, headers: { location: asset.url } });
      }
      throw new HttpError(404, "Media not found.");
    },
  },

  /** Submission review screen: answered / unanswered / flagged. */
  "attempt-review": {
    method: "GET",
    role: "user",
    handler: async (request, ctx, userId) => {
      const attempt = await requireOwnAttempt(ctx, request, userId);
      return json(await buildReview(ctx.tests, attempt));
    },
  },

  "submit-test": {
    method: "POST",
    role: "user",
    handler: async (request, ctx, userId) => {
      assertCsrf(request);
      const data = await parseBody(request, submitSchema);
      const attempt = await requireOwnAttemptId(ctx, data.attemptId, userId);
      assertEditable(attempt);
      const review = await buildReview(ctx.tests, attempt);
      await ctx.tests.finalizeAnswers(attempt.id);
      const timestamp = new Date().toISOString();
      const updated = await ctx.tests.setAttemptStatus(attempt.id, "submitted", {
        submittedAt: timestamp,
      });
      await ctx.tests.logEvent(attempt.id, userId, "attempt.submitted", {
        reason: data.reason,
        answered: review.answered,
        unanswered: review.unanswered,
      });
      await audit(ctx, request, {
        userId,
        action: "test_attempt.submit",
        outcome: "success",
        metadata: { attemptId: attempt.id, reason: data.reason },
      });
      return json({ attempt: updated, review });
    },
  },
};

/* ---------------------------- runner helpers ------------------------------ */

async function requireOwnAttemptId(ctx: Ctx, id: string, userId: string) {
  const attempt = await ctx.tests.getAttempt(id);
  if (!attempt || attempt.userId !== userId) throw new HttpError(404, "Test attempt not found.");
  return attempt;
}

async function requireOwnAttempt(ctx: Ctx, request: Request, userId: string) {
  const url = new URL(request.url);
  return requireOwnAttemptId(ctx, url.searchParams.get("id") ?? "", userId);
}

/** Time-expired attempts are submitted automatically on the next request. */
async function expireIfOverdue(ctx: Ctx, attempt: TestAttemptRecord, userId: string) {
  const deadline = attemptDeadline(attempt);
  if (
    !deadline ||
    Date.now() < new Date(deadline).getTime() ||
    !["in_progress", "paused", "ready", "purchased"].includes(attempt.status)
  ) {
    return attempt;
  }
  await ctx.tests.finalizeAnswers(attempt.id);
  const updated = await ctx.tests.setAttemptStatus(attempt.id, "submitted", {
    submittedAt: new Date().toISOString(),
  });
  await ctx.tests.logEvent(attempt.id, userId, "attempt.auto_submitted", { reason: "time_expired" });
  return updated;
}

export async function handleTestRequest(request: Request, action: string): Promise<Response> {
  try {
    const entry = handlers[action];
    if (!entry) return json({ error: "Unknown endpoint." }, { status: 404 });
    if (entry.method !== request.method)
      return json({ error: "Method not allowed." }, { status: 405 });

    const base = await createContext();
    const user =
      entry.role === "admin"
        ? await requireRole(base, request, "admin")
        : await requireUser(base, request);
    const ctx: Ctx = {
      ...base,
      tests: getTestStore(base.env),
      questions: getQuestionStore(base.env),
    };
    return await entry.handler(request, ctx, user.id);
  } catch (error) {
    return errorResponse(error);
  }
}

export { templateToInput };

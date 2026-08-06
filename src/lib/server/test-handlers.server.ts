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
import { newId } from "./crypto.server";

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
    fields["difficulty"] = "Mixed difficulty is only available for complete mock tests.";
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
};

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

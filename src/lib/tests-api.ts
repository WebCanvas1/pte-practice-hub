/**
 * Client helpers for the test template / attempt API (cookie + CSRF like
 * src/lib/api.ts).
 */
import { ApiError, type ApiFieldErrors } from "@/lib/api";
import type {
  EntitlementRecord,
  TemplateValidation,
  TestAttemptRecord,
  TestTemplateRecord,
} from "@/config/tests";
import type { DifficultyKey, ModuleKey } from "@/config/questions";
import type { AnswerData, RunnerSession } from "@/config/test-runner";

export interface AttemptResult {
  attemptId: string;
  status: "completed" | "pending_ai";
  overall: { earned: number; maximum: number; percentage: number };
  modules: Record<string, { earned: number; maximum: number; percentage: number; status?: "pending_ai" }>;
  questions: Array<{
    attemptQuestionId: string;
    typeKey: string;
    module: ModuleKey;
    answered: boolean;
    earned: number;
    maximum: number;
    percentage: number | null;
    outcome: "correct" | "partial" | "incorrect" | "pending_ai";
    breakdown?: {
      summary?: string;
      strengths?: string[];
      improvements?: string[];
      confidence?: number;
      criteria?: Array<{ name: string; score: number; feedback: string }>;
      transcript?: string;
      acousticEstimateNotice?: string;
    };
  }>;
  scoredAt: string;
}

const TESTS_API_BASE = "/api/public/tests";

function csrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === "pte_csrf") return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function testsApi<T>(
  action: string,
  body?: unknown,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== "" && value !== "all") params.set(key, String(value));
  }
  const search = params.toString();
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  const csrf = csrfTokenFromCookie();
  if (csrf) headers["x-csrf-token"] = csrf;

  let response: Response;
  try {
    response = await fetch(`${TESTS_API_BASE}/${action}${search ? `?${search}` : ""}`, {
      method: body === undefined ? "GET" : "POST",
      credentials: "include",
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(0, "Network error. Please check your connection and try again.");
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const data = (payload ?? {}) as { error?: string; fields?: ApiFieldErrors };
    throw new ApiError(
      response.status,
      data.error ?? "Something went wrong. Please try again.",
      data.fields ?? {},
    );
  }
  return (payload ?? {}) as T;
}

export interface CatalogueTemplate extends TestTemplateRecord {
  estimatedMinutes: number;
  types: { typeKey: string; typeName: string; questionCount: number }[];
}

export interface CatalogueResponse {
  templates: CatalogueTemplate[];
  entitlements: EntitlementRecord[];
  attempts: TestAttemptRecord[];
}

export interface MyTestsResponse {
  attempts: TestAttemptRecord[];
  entitlements: EntitlementRecord[];
  templates: TestTemplateRecord[];
}

export interface AdminTemplatesResponse {
  templates: TestTemplateRecord[];
  validations: TemplateValidation[];
  storage: "d1" | "memory";
}

export interface AiEvaluationJob {
  id: string;
  attempt_id: string;
  attempt_question_id: string;
  module_key: string;
  type_key: string;
  status: "queued" | "processing" | "completed" | "failed";
  provider: string;
  model: string;
  attempt_count: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface GeneratePreviewResponse {
  template: TestTemplateRecord;
  ok: boolean;
  warnings: string[];
  shortfalls: TemplateValidation["rules"];
  questions: {
    position: number;
    id: string;
    module: ModuleKey;
    typeKey: string;
    typeName: string;
    difficulty: DifficultyKey;
    title: string;
    estimatedSeconds: number;
    version: number;
  }[];
}

export const fetchCatalogue = () => testsApi<CatalogueResponse>("catalogue");
export const fetchMyTests = () => testsApi<MyTestsResponse>("my-tests");
export const entitleTest = (id: string) =>
  testsApi<{ entitlement: EntitlementRecord; reused: boolean }>("entitle", { id });
export const startTest = (templateId: string, entitlementId?: string) =>
  testsApi<{ attempt: TestAttemptRecord; warnings: string[] }>("start", {
    templateId,
    ...(entitlementId ? { entitlementId } : {}),
  });

export const fetchAdminTemplates = () => testsApi<AdminTemplatesResponse>("templates");
export const fetchAiEvaluations = () =>
  testsApi<{ jobs: AiEvaluationJob[]; configured: boolean }>("ai-evaluations");
export const duplicateTemplate = (id: string) =>
  testsApi<{ template: TestTemplateRecord }>("template-duplicate", { id });
export const setTemplateActive = (id: string, isActive: boolean) =>
  testsApi<{ template: TestTemplateRecord }>("template-activate", { id, isActive });
export const generatePreview = (id: string) =>
  testsApi<GeneratePreviewResponse>("generate-preview", undefined, { id });
export const validateTemplateApi = (id: string) =>
  testsApi<{ validation: TemplateValidation }>("template-validate", undefined, { id });

/** Payload accepted by template-create / template-update. */
export interface TemplateInput {
  name: string;
  description: string;
  testType: TestTemplateRecord["testType"];
  module: ModuleKey | null;
  difficulty: TestTemplateRecord["difficulty"];
  price: number;
  currency: string;
  timeLimitMinutes: number;
  targetScore: number | null;
  instructions: string;
  isActive: boolean;
  purchasable: boolean;
  rules: { typeKey: string; questionCount: number; difficulty?: DifficultyKey | undefined }[];
}

export const createTemplate = (template: TemplateInput) =>
  testsApi<{ template: TestTemplateRecord }>("template-create", { template });
export const updateTemplate = (id: string, template: TemplateInput, bumpVersion: boolean) =>
  testsApi<{ template: TestTemplateRecord }>("template-update", { id, template, bumpVersion });
export const deleteTemplate = (id: string) => testsApi<{ ok: true }>("template-delete", { id });

/* ------------------------------- test runner ------------------------------- */

export const fetchRunnerSession = (attemptId: string) =>
  testsApi<{ session: RunnerSession }>("runner-session", undefined, { id: attemptId });

export const saveAnswerApi = (input: {
  attemptId: string;
  attemptQuestionId: string;
  text: string;
  data: AnswerData;
  timeSpentSeconds: number;
  currentQuestion?: number;
}) => testsApi<{ savedAt: string; revisionCount: number }>("save-answer", input);

export const fetchAttemptReview = (attemptId: string) =>
  testsApi<{
    items: {
      attemptQuestionId: string;
      position: number;
      typeName: string;
      module: string;
      answered: boolean;
      flagged: boolean;
    }[];
    answered: number;
    unanswered: number;
    flagged: number;
  }>("attempt-review", undefined, { id: attemptId });

export const submitTest = (attemptId: string, reason: "manual" | "time_expired" = "manual") =>
  testsApi<{ attempt: TestAttemptRecord; result: AttemptResult }>("submit-test", { attemptId, reason });

export const fetchAttemptResult = (attemptId: string) =>
  testsApi<{ result: AttemptResult }>("attempt-result", undefined, { id: attemptId });

/** Raw upload: the body is the recorded audio blob, not JSON. */
export async function uploadResponseAudio(
  attemptId: string,
  attemptQuestionId: string,
  blob: Blob,
): Promise<{ audioKey: string; savedAt: string }> {
  const params = new URLSearchParams({ attemptId, attemptQuestionId });
  const headers: Record<string, string> = { "content-type": blob.type || "audio/webm" };
  const csrf = csrfTokenFromCookie();
  if (csrf) headers["x-csrf-token"] = csrf;
  const response = await fetch(`${TESTS_API_BASE}/upload-audio?${params.toString()}`, {
    method: "POST",
    credentials: "include",
    headers,
    body: blob,
  });
  const payload = (await response.json().catch(() => null)) as
    | { audioKey: string; savedAt: string; error?: string }
    | null;
  if (!response.ok) throw new ApiError(response.status, payload?.error ?? "Upload failed.");
  return payload as { audioKey: string; savedAt: string };
}

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

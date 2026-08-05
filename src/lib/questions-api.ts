/**
 * Client helpers for the admin question-bank API.
 *
 * Shares the CSRF + cookie handling of the auth client (see src/lib/api.ts).
 */
import { ApiError, type ApiFieldErrors } from "@/lib/api";
import type {
  QuestionRecord,
  QuestionSort,
  QuestionStatus,
  DifficultyKey,
  ModuleKey,
} from "@/config/questions";

const QUESTIONS_API_BASE = "/api/public/questions";

function csrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === "pte_csrf") return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function questionsApi<T>(
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
    response = await fetch(`${QUESTIONS_API_BASE}/${action}${search ? `?${search}` : ""}`, {
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

export interface QuestionListResponse {
  rows: QuestionRecord[];
  total: number;
  page: number;
  pageSize: number;
  topics: string[];
  tags: string[];
}

export interface QuestionVersionSummary {
  id: string;
  versionNumber: number;
  status: QuestionStatus;
  changeNote: string;
  createdAt: string;
  createdBy: string | null;
}

export interface QuestionQuery {
  search?: string | undefined;
  module?: ModuleKey | "all" | undefined;
  type?: string | undefined;
  difficulty?: DifficultyKey | "all" | undefined;
  status?: QuestionStatus | "all" | undefined;
  topic?: string | undefined;
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
  sort?: QuestionSort | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export const listQuestions = (query: QuestionQuery) =>
  questionsApi<QuestionListResponse>("list", undefined, query as Record<string, string | number | undefined>);

export const getQuestion = (id: string) =>
  questionsApi<{ question: QuestionRecord; versions: QuestionVersionSummary[] }>(
    "get",
    undefined,
    { id },
  );

export const getVersionSnapshot = (id: string, versionNumber: number) =>
  questionsApi<{ snapshot: QuestionRecord }>("versions", undefined, { id, versionNumber });

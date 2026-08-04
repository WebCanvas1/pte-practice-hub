/**
 * Client-side helper for the Worker auth API.
 *
 * Sessions live in an HTTP-only cookie, so requests only need
 * `credentials: "include"` plus the double-submit CSRF header.
 */

export const AUTH_API_BASE = "/api/public/auth";

export interface ApiFieldErrors {
  [field: string]: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields: ApiFieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function csrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === "pte_csrf") return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function authApi<T>(
  action: string,
  body?: unknown,
  method: "GET" | "POST" = body === undefined ? "GET" : "POST",
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["content-type"] = "application/json";
  const csrf = csrfTokenFromCookie();
  if (csrf) headers["x-csrf-token"] = csrf;

  let response: Response;
  try {
    response = await fetch(`${AUTH_API_BASE}/${action}`, {
      method,
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

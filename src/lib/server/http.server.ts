/**
 * HTTP primitives shared by every auth endpoint: JSON responses, cookie
 * handling, CSRF (origin check + double-submit token), and rate limiting.
 */
import { z } from "zod";

import { getWorkerEnv, type WorkerEnv } from "./bindings.server";
import { randomToken } from "./crypto.server";

export const SESSION_COOKIE = "pte_session";
export const CSRF_COOKIE = "pte_csrf";
export const CSRF_HEADER = "x-csrf-token";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(body), { ...init, headers });
}

/** Never leaks internals: unknown failures become a generic 500. */
export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return json(
      { error: error.message, ...(error.fields ? { fields: error.fields } : {}) },
      { status: error.status },
    );
  }
  console.error("[auth] unhandled error", error);
  return json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

export function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}

export function buildCookie(
  request: Request,
  name: string,
  value: string,
  options: { maxAge: number; httpOnly: boolean },
): string {
  const attrs = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${options.maxAge}`,
  ];
  if (options.httpOnly) attrs.push("HttpOnly");
  if (isSecureRequest(request)) attrs.push("Secure");
  return attrs.join("; ");
}

export function sessionCookie(request: Request, token: string): string {
  return buildCookie(request, SESSION_COOKIE, token, {
    maxAge: SESSION_TTL_SECONDS,
    httpOnly: true,
  });
}

export function clearedSessionCookie(request: Request): string {
  return buildCookie(request, SESSION_COOKIE, "", { maxAge: 0, httpOnly: true });
}

export function csrfCookie(request: Request, token: string): string {
  return buildCookie(request, CSRF_COOKIE, token, {
    maxAge: SESSION_TTL_SECONDS,
    httpOnly: false,
  });
}

export function ensureCsrfToken(request: Request): { token: string; setCookie: string | null } {
  const existing = readCookie(request, CSRF_COOKIE);
  if (existing) return { token: existing, setCookie: null };
  const token = randomToken(24);
  return { token, setCookie: csrfCookie(request, token) };
}

/**
 * CSRF defence for state-changing requests:
 *  1. Origin/Referer must match the request host (blocks cross-site forms).
 *  2. When a CSRF cookie exists it must match the `x-csrf-token` header.
 */
export function assertCsrf(request: Request): void {
  const host = request.headers.get("host");
  const origin = request.headers.get("origin") ?? request.headers.get("referer");
  if (origin) {
    try {
      if (new URL(origin).host !== host) throw new HttpError(403, "Request blocked.");
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(403, "Request blocked.");
    }
  }
  const cookieToken = readCookie(request, CSRF_COOKIE);
  const headerToken = request.headers.get(CSRF_HEADER);
  if (cookieToken && cookieToken !== headerToken) {
    throw new HttpError(403, "Invalid security token. Please refresh and try again.");
  }
}

export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new HttpError(400, "Invalid request body.");
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!fields[key]) fields[key] = issue.message;
    }
    throw new HttpError(422, "Please check the highlighted fields.", fields);
  }
  return parsed.data;
}

export function clientIp(request: Request): string | null {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}

export function userAgent(request: Request): string | null {
  return request.headers.get("user-agent")?.slice(0, 255) ?? null;
}

/* ------------------------------- rate limiting ----------------------------- */

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

/** Uses SESSIONS_KV when bound, otherwise an in-process bucket (dev). */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const env: WorkerEnv = await getWorkerEnv();
  const kv = env.SESSIONS_KV;

  if (kv) {
    const raw = await kv.get(`rl:${key}`);
    const count = raw ? Number(raw) : 0;
    if (count >= limit) return { allowed: false, retryAfter: windowSeconds };
    await kv.put(`rl:${key}`, String(count + 1), { expirationTtl: windowSeconds });
    return { allowed: true, retryAfter: 0 };
  }

  const nowMs = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt < nowMs) {
    memoryBuckets.set(key, { count: 1, resetAt: nowMs + windowSeconds * 1000 });
    return { allowed: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - nowMs) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}

export async function resetRateLimit(key: string): Promise<void> {
  const env = await getWorkerEnv();
  if (env.SESSIONS_KV) await env.SESSIONS_KV.delete(`rl:${key}`);
  memoryBuckets.delete(key);
}

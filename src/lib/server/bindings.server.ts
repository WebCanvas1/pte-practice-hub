/**
 * Cloudflare binding + secret resolution.
 *
 * In production the Worker receives its bindings from wrangler.toml
 * (`cloudflare:workers` exposes them as `env`). During local `vite dev`
 * there is no workerd runtime, so bindings are absent and the app falls
 * back to the in-memory development store (see store.server.ts).
 */

export interface D1PreparedStatement {
  bind: (...values: unknown[]) => D1PreparedStatement;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<{ results: T[] }>;
  run: () => Promise<unknown>;
}

export interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
}

export interface KVNamespace {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

export interface R2Bucket {
  get: (key: string) => Promise<unknown>;
  put: (
    key: string,
    value: unknown,
    options?: { httpMetadata?: { contentType?: string } },
  ) => Promise<unknown>;
  delete: (key: string) => Promise<void>;
}

export interface QueueBinding {
  send: (message: unknown) => Promise<void>;
}
export interface WorkflowBinding {
  create: (options: { id: string; params: unknown }) => Promise<unknown>;
}
export interface VectorizeBinding {
  query: (vector: number[], options?: { topK?: number }) => Promise<unknown>;
  upsert: (vectors: unknown[]) => Promise<unknown>;
}

export interface AiBinding {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
}

export interface WorkerEnv {
  APP_ENV: string | undefined;
  DB: D1Database | undefined;
  SETTINGS_KV: KVNamespace | undefined;
  SESSIONS_KV: KVNamespace | undefined;
  MEDIA: R2Bucket | undefined;
  AI: AiBinding | undefined;
  AI_WRITING_MODEL: string | undefined;
  AI_SPEAKING_MODEL: string | undefined;
  AI_TRANSCRIPTION_MODEL: string | undefined;
  SESSION_SECRET: string | undefined;
  ADMIN_SETUP_SECRET: string | undefined;
  APP_URL: string | undefined;
  SUPPORT_EMAIL: string | undefined;
  CLOUDFLARE_ACCOUNT_ID: string | undefined;
  STRIPE_SECRET_KEY: string | undefined;
  STRIPE_WEBHOOK_SECRET: string | undefined;
  STRIPE_PUBLISHABLE_KEY: string | undefined;
  EMAIL_API_KEY: string | undefined;
  CONTENT_IMPORT_QUEUE: QueueBinding | undefined;
  CONTENT_IMPORT_WORKFLOW: WorkflowBinding | undefined;
  QUESTION_VECTORS: VectorizeBinding | undefined;
}

let cached: WorkerEnv | undefined;

export async function getWorkerEnv(): Promise<WorkerEnv> {
  if (cached) return cached;

  let bindings: Record<string, unknown> = {};
  try {
    // Resolved at runtime only: the module exists in workerd, not in Node dev.
    const specifier = "cloudflare:workers";
    const mod = (await import(/* @vite-ignore */ specifier)) as {
      env?: Record<string, unknown>;
    };
    bindings = mod.env ?? {};
  } catch {
    bindings = {};
  }

  const fromProcess = (key: string) =>
    (bindings[key] as string | undefined) ?? process.env[key] ?? undefined;

  const resolved: WorkerEnv = {
    APP_ENV: fromProcess("APP_ENV"),
    DB: bindings["DB"] as D1Database | undefined,
    SETTINGS_KV: bindings["SETTINGS_KV"] as KVNamespace | undefined,
    SESSIONS_KV: bindings["SESSIONS_KV"] as KVNamespace | undefined,
    MEDIA: bindings["MEDIA"] as R2Bucket | undefined,
    AI: bindings["AI"] as AiBinding | undefined,
    AI_WRITING_MODEL: fromProcess("AI_WRITING_MODEL"),
    AI_SPEAKING_MODEL: fromProcess("AI_SPEAKING_MODEL"),
    AI_TRANSCRIPTION_MODEL: fromProcess("AI_TRANSCRIPTION_MODEL"),
    SESSION_SECRET: fromProcess("SESSION_SECRET"),
    ADMIN_SETUP_SECRET: fromProcess("ADMIN_SETUP_SECRET"),
    APP_URL: fromProcess("APP_URL"),
    SUPPORT_EMAIL: fromProcess("SUPPORT_EMAIL"),
    CLOUDFLARE_ACCOUNT_ID: fromProcess("CLOUDFLARE_ACCOUNT_ID"),
    STRIPE_SECRET_KEY: fromProcess("STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET: fromProcess("STRIPE_WEBHOOK_SECRET"),
    STRIPE_PUBLISHABLE_KEY: fromProcess("STRIPE_PUBLISHABLE_KEY"),
    EMAIL_API_KEY: fromProcess("EMAIL_API_KEY"),
    CONTENT_IMPORT_QUEUE: bindings["CONTENT_IMPORT_QUEUE"] as QueueBinding | undefined,
    CONTENT_IMPORT_WORKFLOW: bindings["CONTENT_IMPORT_WORKFLOW"] as WorkflowBinding | undefined,
    QUESTION_VECTORS: bindings["QUESTION_VECTORS"] as VectorizeBinding | undefined,
  };

  cached = resolved;
  return resolved;
}

export function appUrl(env: WorkerEnv, request: Request): string {
  if (env.APP_URL && env.APP_URL.length > 0) return env.APP_URL.replace(/\/$/, "");
  return new URL(request.url).origin;
}

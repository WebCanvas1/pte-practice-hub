import { processJob } from "./lib/server/content-import.server";
import type { WorkerEnv } from "./lib/server/bindings.server";
import { renderErrorPage } from "./lib/error-page";

export { ContentImportWorkflow } from "./workflows/content-import.workflow";

type ServerEntry = {
  fetch: (request: Request, env: WorkerEnv, ctx: ExecutionContext) => Promise<Response> | Response;
};

type QueueMessage = {
  body: { jobId?: unknown };
  ack: () => void;
  retry: (options?: unknown) => void;
};
type QueueBatch = { messages: QueueMessage[] };

const serverEntryPromise = import("@tanstack/react-start/server-entry").then(
  (module) => (module.default ?? module) as ServerEntry,
);

const log = (level: "info" | "error", event: Record<string, unknown>) =>
  console[level](JSON.stringify({ timestamp: new Date().toISOString(), level, ...event }));

function harden(response: Response, request: Request, id: string, production: boolean) {
  const headers = new Headers(response.headers);
  headers.set("x-request-id", id);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), geolocation=(), payment=(self), usb=()");
  headers.set("x-frame-options", "DENY");
  headers.set(
    "content-security-policy",
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self' data:",
  );
  if (production && new URL(request.url).protocol === "https:")
    headers.set("strict-transport-security", "max-age=31536000; includeSubDomains; preload");
  if (request.method !== "GET" || new URL(request.url).pathname.startsWith("/api/"))
    headers.set("cache-control", "no-store");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext) {
    const id = request.headers.get("cf-ray") ?? crypto.randomUUID();
    const started = Date.now();
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        return harden(
          Response.json({ status: "ok", requestId: id, environment: env.APP_ENV }),
          request,
          id,
          env.APP_ENV === "production",
        );
      }
      const handler = await serverEntryPromise;
      const response = await handler.fetch(request, env, ctx);
      log("info", {
        event: "request",
        requestId: id,
        method: request.method,
        path: url.pathname,
        status: response.status,
        durationMs: Date.now() - started,
      });
      return harden(response, request, id, env.APP_ENV === "production");
    } catch (error) {
      log("error", {
        event: "request_failed",
        requestId: id,
        method: request.method,
        path: url.pathname,
        durationMs: Date.now() - started,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return harden(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        request,
        id,
        env.APP_ENV === "production",
      );
    }
  },
  async queue(batch: QueueBatch, env: WorkerEnv) {
    if (!env.DB) throw new Error("D1 binding DB is required for import processing.");
    for (const message of batch.messages) {
      const jobId = typeof message.body?.jobId === "string" ? message.body.jobId : "";
      if (!jobId) {
        message.ack();
        continue;
      }
      try {
        await processJob(env, env.DB, jobId);
        message.ack();
      } catch (error) {
        log("error", {
          event: "import_job_failed",
          jobId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        message.retry({ delaySeconds: 30 });
      }
    }
  },
};

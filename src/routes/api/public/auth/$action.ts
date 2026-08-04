import { createFileRoute } from "@tanstack/react-router";

/**
 * Cloudflare Worker auth API.
 *
 * Placed under /api/public/* so unauthenticated visitors (register, login,
 * password reset) can reach it; every handler enforces its own validation,
 * CSRF and role checks. The server-only implementation is imported inside the
 * handler so it never enters the client bundle.
 */
export const Route = createFileRoute("/api/public/auth/$action")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { handleAuthRequest } = await import("@/lib/server/handlers.server");
        return handleAuthRequest(request, params.action);
      },
      POST: async ({ request, params }) => {
        const { handleAuthRequest } = await import("@/lib/server/handlers.server");
        return handleAuthRequest(request, params.action);
      },
    },
  },
});

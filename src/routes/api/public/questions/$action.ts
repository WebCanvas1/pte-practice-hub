import { createFileRoute } from "@tanstack/react-router";

/**
 * Admin question-bank API.
 *
 * Under /api/public/* so the Worker serves it without the published-site auth
 * wrapper; the handler itself requires an authenticated admin session and a
 * CSRF token for every write.
 */
export const Route = createFileRoute("/api/public/questions/$action")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { handleQuestionRequest } = await import("@/lib/server/question-handlers.server");
        return handleQuestionRequest(request, params.action);
      },
      POST: async ({ request, params }) => {
        const { handleQuestionRequest } = await import("@/lib/server/question-handlers.server");
        return handleQuestionRequest(request, params.action);
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";

/**
 * Test template, generation and attempt API.
 *
 * Under /api/public/* so the Worker serves it without the published-site auth
 * wrapper; each action enforces its own session/role check plus CSRF on writes.
 */
export const Route = createFileRoute("/api/public/tests/$action")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { handleTestRequest } = await import("@/lib/server/test-handlers.server");
        return handleTestRequest(request, params.action);
      },
      POST: async ({ request, params }) => {
        const { handleTestRequest } = await import("@/lib/server/test-handlers.server");
        return handleTestRequest(request, params.action);
      },
    },
  },
});

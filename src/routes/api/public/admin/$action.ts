import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/admin/$action")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { handleAdminRequest } = await import("@/lib/server/admin-operations.server");
        return handleAdminRequest(request, params.action);
      },
      POST: async ({ request, params }) => {
        const { handleAdminRequest } = await import("@/lib/server/admin-operations.server");
        return handleAdminRequest(request, params.action);
      },
    },
  },
});

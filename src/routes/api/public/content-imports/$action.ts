import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/public/content-imports/$action")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { handleContentImport } = await import("@/lib/server/content-import.server");
        return handleContentImport(request, params.action);
      },
      POST: async ({ request, params }) => {
        const { handleContentImport } = await import("@/lib/server/content-import.server");
        return handleContentImport(request, params.action);
      },
    },
  },
});

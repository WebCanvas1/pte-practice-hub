import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/payments/$action")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { handlePaymentRequest } = await import("@/lib/server/payments.server");
        return handlePaymentRequest(request, params.action);
      },
      POST: async ({ request, params }) => {
        const { handlePaymentRequest } = await import("@/lib/server/payments.server");
        return handlePaymentRequest(request, params.action);
      },
    },
  },
});

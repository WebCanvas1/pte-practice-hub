import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, SectionCard, EmptyState, LoadingState } from "@/components/common/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/health")({ component: Page });
type Health = {
  d1: Record<string, unknown>;
  r2: Record<string, unknown>;
  kv: Record<string, unknown>;
  queue: Record<string, unknown>;
  ai: Record<string, unknown>;
  stripeWebhook: Record<string, unknown>;
  recentErrors: Record<string, unknown>[];
  failedJobs: Record<string, unknown>[];
};
function Page() {
  const [data, setData] = useState<Health | null>(null);
  useEffect(() => {
    void adminApi<{ health: Health }>("health")
      .then((x) => setData(x.health))
      .catch((e) => toast.error(e.message));
  }, []);
  if (!data) return <LoadingState rows={8} />;
  const services = [
    ["D1", data.d1],
    ["R2", data.r2],
    ["KV", data.kv],
    ["Content queue", data.queue],
    ["AI provider", data.ai],
    ["Stripe webhook", data.stripeWebhook],
  ] as const;
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Platform Health"
        description="Server-verified bindings, integrations, recent errors and failed jobs."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map(([name, value]) => (
          <div key={name} className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{name}</h2>
              <Badge
                variant={
                  String(value["status"]).includes("fail") ||
                  String(value["status"]).includes("unavailable")
                    ? "destructive"
                    : "success"
                }
              >
                {String(value["status"])}
              </Badge>
            </div>
            <pre className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        ))}
      </div>
      <SectionCard title="Recent errors">
        {data.recentErrors.length ? (
          <pre className="overflow-auto whitespace-pre-wrap text-xs">
            {JSON.stringify(data.recentErrors, null, 2)}
          </pre>
        ) : (
          <EmptyState title="No recent platform errors" />
        )}
      </SectionCard>
      <SectionCard title="Recent failed jobs">
        {data.failedJobs.length ? (
          <pre className="overflow-auto whitespace-pre-wrap text-xs">
            {JSON.stringify(data.failedJobs, null, 2)}
          </pre>
        ) : (
          <EmptyState title="No recent failed jobs" />
        )}
      </SectionCard>
    </div>
  );
}

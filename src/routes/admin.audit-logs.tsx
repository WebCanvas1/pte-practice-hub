import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, SectionCard, EmptyState, LoadingState } from "@/components/common/ui-blocks";
import { Badge } from "@/components/ui/badge";
import { adminApi } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/audit-logs")({ component: Page });
type Log = {
  id: string;
  adminUser: string;
  action: string;
  result: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};
function Page() {
  const [logs, setLogs] = useState<Log[] | null>(null);
  useEffect(() => {
    void adminApi<{ logs: Log[] }>("audit-logs")
      .then((x) => setLogs(x.logs))
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Audit Logs"
        description="Immutable administrative activity with actor, request metadata, before/after summaries and outcome."
      />
      <SectionCard title="Audit trail" description="Newest 300 events">
        {!logs ? (
          <LoadingState rows={8} />
        ) : logs.length === 0 ? (
          <EmptyState title="No audit events yet" />
        ) : (
          <div className="divide-y rounded-lg border">
            {logs.map((log) => (
              <details key={log.id} className="p-4">
                <summary className="grid cursor-pointer gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
                  <span className="font-medium">{log.adminUser}</span>
                  <span>{log.action}</span>
                  <Badge variant={log.result === "success" ? "success" : "destructive"}>
                    {log.result}
                  </Badge>
                  <time className="text-sm text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </time>
                </summary>
                <div className="mt-3 rounded-md bg-muted p-3 text-xs">
                  <p>IP: {log.ipAddress ?? "Not available"}</p>
                  <p>User agent: {log.userAgent ?? "Not available"}</p>
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              </details>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

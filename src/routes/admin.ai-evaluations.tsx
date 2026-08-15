import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DataTable } from "@/components/common/DataTable";
import { PageHeader, SectionCard } from "@/components/common/ui-blocks";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";
import { fetchAiEvaluations } from "@/lib/tests-api";

export const Route = createFileRoute("/admin/ai-evaluations")({
  head: () => ({ meta: [{ title: `AI Evaluations — ${siteConfig.name}` }] }),
  component: Page,
});

function Page() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-ai-evaluations"],
    queryFn: fetchAiEvaluations,
    refetchInterval: 15_000,
  });
  return (
    <>
      <PageHeader title="AI Evaluations" description="Writing evaluation jobs and model status." />
      {data && !data.configured && (
        <Alert className="mb-6">
          <AlertTitle>Workers AI is not configured</AlertTitle>
          <AlertDescription>
            Add the AI binding before evaluating Writing responses.
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Could not load evaluation jobs</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Try again shortly."}
          </AlertDescription>
        </Alert>
      )}
      <SectionCard title="AI evaluation jobs" description="The latest 100 server-side evaluations">
        <DataTable
          caption="AI evaluation jobs"
          rows={data?.jobs ?? []}
          getRowKey={(row) => row.id}
          emptyTitle={isLoading ? "Loading evaluations…" : "No evaluations yet"}
          columns={[
            { key: "id", header: "Job", render: (row) => row.id },
            { key: "attempt", header: "Attempt", render: (row) => row.attempt_id },
            { key: "type", header: "Task", render: (row) => row.type_key.replaceAll("_", " ") },
            { key: "model", header: "Model", render: (row) => row.model.replace("@cf/meta/", "") },
            {
              key: "state",
              header: "State",
              align: "right",
              render: (row) => (
                <Badge
                  variant={
                    row.status === "completed"
                      ? "success"
                      : row.status === "failed"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
          ]}
        />
      </SectionCard>
    </>
  );
}

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader, SectionCard } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
import { fetchMyTests } from "@/lib/tests-api";

export const Route = createFileRoute("/student/test-history")({ component: Page });
function Page() {
  const { data } = useQuery({ queryKey: ["my-tests"], queryFn: fetchMyTests });
  const rows = (data?.attempts ?? []).filter(
    (a) => a.status === "completed" || a.status === "submitted",
  );
  return (
    <>
      <PageHeader
        title="Test History"
        description="Every submitted attempt with its protected score report."
      />
      <SectionCard
        title="Completed attempts"
        description={`${rows.length} result${rows.length === 1 ? "" : "s"}`}
      >
        <DataTable
          caption="Completed attempts"
          rows={rows}
          getRowKey={(r) => r.id}
          emptyTitle="No completed tests yet"
          columns={[
            { key: "title", header: "Test", render: (r) => r.templateName },
            {
              key: "date",
              header: "Date",
              render: (r) =>
                new Date(r.completedAt ?? r.submittedAt ?? r.createdAt).toLocaleDateString("en-AU"),
            },
            {
              key: "score",
              header: "Score",
              align: "right",
              render: (r) =>
                r.totalScore === null ? "Processing" : `${Math.round(r.totalScore * 0.9)}/90`,
            },
            {
              key: "view",
              header: "",
              align: "right",
              render: (r) => (
                <Button asChild size="sm" variant="outline">
                  <Link to="/student/results/$attemptId" params={{ attemptId: r.id }}>
                    View
                  </Link>
                </Button>
              ),
            },
          ]}
        />
      </SectionCard>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/admin/ai-evaluations")({
  head: () => ({ meta: [{ title: "AI Evaluations — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="AI Evaluations" description="Evaluation queue and model configuration status." />
      <SectionCard title="AI evaluation jobs" description="Placeholder data">
        <DataTable
          caption="AI evaluation jobs"
          rows={data.adminEvaluations}
          getRowKey={(row) => row.id}
          emptyTitle="Nothing here yet"
          columns={[
              { key: "id", header: "Job", render: (r) => r.id },
              { key: "attempt", header: "Attempt", render: (r) => r.attempt },
              { key: "module", header: "Module", render: (r) => r.module },
              { key: "state", header: "State", align: "right", render: (r) => <Badge variant={r.state === "Complete" ? "success" : "warning"}>{r.state}</Badge> },
          ]}
        />
      </SectionCard>
    </>
  );
}

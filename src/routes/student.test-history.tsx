import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/student/test-history")({
  head: () => ({ meta: [{ title: "Test History — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Test History" description="Every completed attempt with its score report." />
      <SectionCard title="Completed attempts" description="Placeholder data">
        <DataTable
          caption="Completed attempts"
          rows={data.testHistory}
          getRowKey={(row) => row.id}
          emptyTitle="Nothing here yet"
          columns={[
              { key: "id", header: "Attempt", render: (r) => r.id },
              { key: "title", header: "Test", render: (r) => r.title },
              { key: "date", header: "Date", render: (r) => r.date },
              { key: "score", header: "Score", align: "right", render: (r) => `${r.score}/90` },
          ]}
        />
      </SectionCard>
    </>
  );
}

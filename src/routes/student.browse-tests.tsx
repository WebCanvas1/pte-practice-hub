import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/student/browse-tests")({
  head: () => ({ meta: [{ title: "Browse Tests — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Browse Tests" description="Pick a module and difficulty level. Purchasing is not enabled yet." />
      <SectionCard title="Available tests" description="Placeholder data">
        <DataTable
          caption="Available tests"
          rows={data.testCatalogue}
          getRowKey={(row) => row.id}
          emptyTitle="Nothing here yet"
          columns={[
              { key: "title", header: "Test", render: (r) => r.title },
              { key: "module", header: "Module", render: (r) => r.module },
              { key: "difficulty", header: "Level", render: (r) => <Badge variant="secondary">{r.difficulty}</Badge> },
              { key: "minutes", header: "Duration", render: (r) => `~${r.minutes} min` },
              { key: "price", header: "Price", align: "right", render: (r) => formatPrice(r.price) },
          ]}
        />
      </SectionCard>
    </>
  );
}

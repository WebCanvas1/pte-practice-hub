import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/student/my-tests")({
  head: () => ({ meta: [{ title: "My Tests — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="My Tests" description="Tests you own, in progress or ready to start." />
      <SectionCard title="Your test library" description="Placeholder data">
        <DataTable
          caption="Your test library"
          rows={data.myTests}
          getRowKey={(row) => row.id}
          emptyTitle="Nothing here yet"
          columns={[
              { key: "title", header: "Test", render: (r) => r.title },
              { key: "module", header: "Module", render: (r) => r.module },
              { key: "status", header: "Status", render: (r) => <Badge variant={r.progress > 0 ? "info" : "secondary"}>{r.status}</Badge> },
              { key: "progress", header: "Progress", align: "right", render: (r) => `${r.progress}%` },
          ]}
        />
      </SectionCard>
    </>
  );
}

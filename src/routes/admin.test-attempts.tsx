import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/admin/test-attempts")({
  head: () => ({ meta: [{ title: "Test Attempts — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Test Attempts" description="All submissions and their scoring state." />
      <SectionCard title="Test attempts" description="Placeholder data">
        <DataTable
          caption="Test attempts"
          rows={data.adminAttempts}
          getRowKey={(row) => row.id}
          emptyTitle="Nothing here yet"
          columns={[
              { key: "id", header: "Attempt", render: (r) => r.id },
              { key: "student", header: "Student", render: (r) => r.student },
              { key: "test", header: "Test", render: (r) => r.test },
              { key: "status", header: "Status", align: "right", render: (r) => <Badge variant={r.status === "Scored" ? "success" : "warning"}>{r.status}</Badge> },
          ]}
        />
      </SectionCard>
    </>
  );
}

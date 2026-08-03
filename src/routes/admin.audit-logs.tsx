import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/admin/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Audit Logs" description="Administrative activity trail." />
      <SectionCard title="Audit trail" description="Placeholder data">
        <DataTable
          caption="Audit trail"
          rows={data.auditLogs}
          getRowKey={(row) => row.id}
          emptyTitle="Nothing here yet"
          columns={[
              { key: "id", header: "Event", render: (r) => r.id },
              { key: "actor", header: "Actor", render: (r) => r.actor },
              { key: "action", header: "Action", render: (r) => r.action },
              { key: "when", header: "When", align: "right", render: (r) => r.when },
          ]}
        />
      </SectionCard>
    </>
  );
}

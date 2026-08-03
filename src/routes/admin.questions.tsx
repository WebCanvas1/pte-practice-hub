import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/admin/questions")({
  head: () => ({ meta: [{ title: "Questions — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Questions" description="Question bank across modules, task types and difficulty levels." />
      <SectionCard title="Question bank" description="Placeholder data">
        <DataTable
          caption="Question bank"
          rows={data.adminQuestions}
          getRowKey={(row) => row.id}
          emptyTitle="Nothing here yet"
          columns={[
              { key: "id", header: "ID", render: (r) => r.id },
              { key: "module", header: "Module", render: (r) => r.module },
              { key: "type", header: "Task type", render: (r) => r.type },
              { key: "difficulty", header: "Level", render: (r) => <Badge variant="secondary">{r.difficulty}</Badge> },
              { key: "status", header: "Status", align: "right", render: (r) => <Badge variant={r.status === "Published" ? "success" : "warning"}>{r.status}</Badge> },
          ]}
        />
      </SectionCard>
    </>
  );
}

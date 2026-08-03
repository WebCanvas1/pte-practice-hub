import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Students — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Students" description="Registered student accounts and activity." />
      <SectionCard title="Student accounts" description="Placeholder data">
        <DataTable
          caption="Student accounts"
          rows={data.adminStudents}
          getRowKey={(row) => row.id}
          emptyTitle="Nothing here yet"
          columns={[
              { key: "name", header: "Student", render: (r) => r.name },
              { key: "email", header: "Email", render: (r) => r.email },
              { key: "tests", header: "Tests", render: (r) => String(r.tests) },
              { key: "avg", header: "Average", align: "right", render: (r) => `${r.avg}/90` },
          ]}
        />
      </SectionCard>
    </>
  );
}

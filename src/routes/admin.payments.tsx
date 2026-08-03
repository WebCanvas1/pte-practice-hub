import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payments — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Payments" description="Transaction records. Payment processing is not enabled yet." />
      <SectionCard title="Payments" description="Placeholder data">
        <DataTable
          caption="Payments"
          rows={data.adminPayments}
          getRowKey={(row) => row.id}
          emptyTitle="Nothing here yet"
          columns={[
              { key: "id", header: "Invoice", render: (r) => r.id },
              { key: "student", header: "Student", render: (r) => r.student },
              { key: "item", header: "Item", render: (r) => r.item },
              { key: "amount", header: "Amount", align: "right", render: (r) => formatPrice(r.amount) },
          ]}
        />
      </SectionCard>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/student/purchases")({
  head: () => ({ meta: [{ title: "Purchases — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Purchases" description="Receipts and test credits. Payments are not enabled yet." />
      <SectionCard title="Purchase history" description="Placeholder data">
        <DataTable
          caption="Purchase history"
          rows={data.purchases}
          getRowKey={(row) => row.id}
          emptyTitle="Nothing here yet"
          columns={[
              { key: "id", header: "Invoice", render: (r) => r.id },
              { key: "item", header: "Item", render: (r) => r.item },
              { key: "date", header: "Date", render: (r) => r.date },
              { key: "amount", header: "Amount", align: "right", render: (r) => formatPrice(r.amount) },
          ]}
        />
      </SectionCard>
    </>
  );
}

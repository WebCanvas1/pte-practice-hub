import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Coupons" description="Discount codes and campaign tracking." />
      <SectionCard title="Coupons" description="Placeholder screen">
        <EmptyState title="No coupons configured" description="Coupons become available once payments are enabled." action={<Button variant="outline">Coming soon</Button>} />
      </SectionCard>
    </>
  );
}

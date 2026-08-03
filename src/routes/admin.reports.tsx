import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Reports" description="Revenue, usage and score distribution reporting." />
      <SectionCard title="Reports" description="Placeholder screen">
        <EmptyState title="No reports generated yet" description="Scheduled exports and score analytics will appear here." action={<Button variant="outline">Coming soon</Button>} />
      </SectionCard>
    </>
  );
}

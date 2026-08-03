import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/admin/content-imports")({
  head: () => ({ meta: [{ title: "Content Imports — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Content Imports" description="Bulk import questions and media assets." />
      <SectionCard title="Content Imports" description="Placeholder screen">
        <EmptyState title="No imports run yet" description="CSV and audio bulk uploads will be processed and validated here." action={<Button variant="outline">Coming soon</Button>} />
      </SectionCard>
    </>
  );
}

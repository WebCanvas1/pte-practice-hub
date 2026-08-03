import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/admin/platform-settings")({
  head: () => ({ meta: [{ title: "Platform Settings — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Platform Settings" description="Platform name, logo, support email, pricing labels and brand colours." />
      <SectionCard title="Platform Settings" description="Placeholder screen">
        <EmptyState title="Editing is read-only in this preview" description="These values currently come from the central config file (src/config/site.ts) and environment variables." action={<Button variant="outline">Coming soon</Button>} />
      </SectionCard>
    </>
  );
}

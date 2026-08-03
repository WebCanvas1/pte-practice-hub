import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/student/account-settings")({
  head: () => ({ meta: [{ title: "Account Settings — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Account Settings" description="Password, notifications and data controls." />
      <SectionCard title="Account Settings" description="Placeholder screen">
        <EmptyState title="Settings are not editable yet" description="Password changes, email notifications and account deletion will live here." action={<Button variant="outline">Coming soon</Button>} />
      </SectionCard>
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/student/profile")({
  head: () => ({ meta: [{ title: "Profile — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Profile" description="Your personal details and target score." />
      <SectionCard title="Profile" description="Placeholder screen">
        <EmptyState title="Profile editing arrives with the backend" description="Name, email, target score and study preferences will be editable here." action={<Button variant="outline">Coming soon</Button>} />
      </SectionCard>
    </>
  );
}

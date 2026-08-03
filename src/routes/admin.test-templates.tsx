import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, SectionCard, EmptyState } from "@/components/common/ui-blocks";
import { DataTable } from "@/components/common/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { siteConfig, formatPrice } from "@/config/site";
import * as data from "@/data/placeholder";

export const Route = createFileRoute("/admin/test-templates")({
  head: () => ({ meta: [{ title: "Test Templates — " + siteConfig.name }] }),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader title="Test Templates" description="Compose module tests and full mock tests from the question bank." />
      <SectionCard title="Test Templates" description="Placeholder screen">
        <EmptyState title="No templates created yet" description="Templates define task order, timing and difficulty mix for each test." action={<Button variant="outline">Coming soon</Button>} />
      </SectionCard>
    </>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/admin/reports")({ component: Page });
function Page() {
  return (
    <>
      <PageHeader title="Reports" description="Printable student reports and platform analytics." />
      <SectionCard
        title="Reporting is live"
        description="Student reports are generated from protected attempt data and versioned in D1."
      >
        <p className="text-muted-foreground">
          Use a student result page to generate a printable HTML report. Platform-wide metrics are
          available on the overview.
        </p>
        <Button asChild className="mt-4">
          <Link to="/admin">Open analytics</Link>
        </Button>
      </SectionCard>
    </>
  );
}

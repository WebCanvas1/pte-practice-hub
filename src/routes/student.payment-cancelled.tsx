import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/student/payment-cancelled")({ component: Page });
function Page() {
  return (
    <EmptyState
      title="Checkout cancelled"
      description="You were not charged and no test was unlocked."
      action={
        <Button asChild>
          <Link to="/student/browse-tests">Return to tests</Link>
        </Button>
      }
    />
  );
}

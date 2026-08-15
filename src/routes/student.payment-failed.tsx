import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/student/payment-failed")({ component: Page });
function Page() {
  return (
    <EmptyState
      title="Payment unsuccessful"
      description="No test was unlocked. You can safely try again."
      action={
        <Button asChild>
          <Link to="/student/browse-tests">Try again</Link>
        </Button>
      }
    />
  );
}

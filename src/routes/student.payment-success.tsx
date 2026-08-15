import { createFileRoute, Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/student/payment-success")({ component: Page });
function Page() {
  return (
    <EmptyState
      title="Payment received"
      description="Your test appears in My Tests only after Stripe's signed webhook securely creates the entitlement."
      action={
        <Button asChild>
          <Link to="/student/my-tests">Check My Tests</Link>
        </Button>
      }
    />
  );
}

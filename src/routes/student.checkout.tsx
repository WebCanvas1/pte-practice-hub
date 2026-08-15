import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { createCheckout } from "@/lib/payments-api";

export const Route = createFileRoute("/student/checkout")({
  validateSearch: z.object({ template: z.string().min(3) }),
  component: Page,
});
function Page() {
  const { template } = Route.useSearch();
  const [coupon, setCoupon] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function start() {
    setBusy(true);
    setError(null);
    try {
      const result = await createCheckout(template, coupon.trim() || undefined);
      window.location.assign(result.url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Unable to start Checkout.");
      setBusy(false);
    }
  }
  useEffect(() => {
    void start();
  }, []);
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
      <h1 className="mt-5 text-2xl font-semibold">Preparing secure checkout</h1>
      <p className="mt-2 text-muted-foreground">
        Your price is validated on the server before Stripe opens.
      </p>
      {error ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Input
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            placeholder="Coupon code (optional)"
            aria-label="Coupon code"
          />
          <Button disabled={busy} onClick={() => void start()}>
            Try again
          </Button>
          <Button asChild variant="link">
            <Link to="/student/browse-tests">Cancel</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

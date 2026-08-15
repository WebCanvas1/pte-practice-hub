import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard, LoadingState } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/config/site";
import { fetchReceipt, type Purchase } from "@/lib/payments-api";
type Receipt = Purchase & { stripe_payment_intent_id: string | null };
export const Route = createFileRoute("/student/receipt/$purchaseId")({ component: Page });
function Page() {
  const { purchaseId } = Route.useParams();
  const [r, setR] = useState<Receipt | null>(null);
  useEffect(() => {
    void fetchReceipt(purchaseId).then((v) => setR(v.receipt));
  }, [purchaseId]);
  return (
    <>
      <PageHeader
        title="Receipt details"
        description="Visible only to the account that made this purchase."
        actions={<Button onClick={() => window.print()}>Print</Button>}
      />
      <SectionCard title="Payment receipt" description={`Reference ${purchaseId}`}>
        {!r ? (
          <LoadingState rows={3} label="Loading receipt" />
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Item</dt>
              <dd>{r.product_name}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Amount</dt>
              <dd>{formatPrice(r.amount / 100)}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Purchased</dt>
              <dd>{new Date(r.purchased_at).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Stripe reference</dt>
              <dd className="break-all">{r.stripe_payment_intent_id ?? "No charge"}</dd>
            </div>
          </dl>
        )}
      </SectionCard>
    </>
  );
}

import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard, EmptyState, LoadingState } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, siteConfig } from "@/config/site";
import { paymentsApi } from "@/lib/payments-api";

interface AdminPayment {
  id: string;
  email: string;
  product_name: string | null;
  amount: number;
  status: string;
  stripe_payment_intent_id: string | null;
  entitlement_id: string | null;
  entitlement_status: string | null;
  checkout_session_id: string;
}
interface Event {
  stripe_event_id: string;
  event_type: string;
  status: string;
  attempts: number;
  error_message: string | null;
}
export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: `Payments — ${siteConfig.name}` }] }),
  component: Page,
});
function Page() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<{ payments: AdminPayment[]; events: Event[] } | null>(null);
  const load = () =>
    paymentsApi<{ payments: AdminPayment[]; events: Event[] }>(
      `admin?q=${encodeURIComponent(q)}`,
    ).then(setData);
  useEffect(() => {
    void load();
  }, []);
  return (
    <>
      <PageHeader
        title="Payment management"
        description="Search transactions, inspect Stripe references, entitlements and webhook processing."
        actions={
          <div className="flex gap-2">
            <Input
              aria-label="Search payments"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Email or reference"
            />
            <Button onClick={() => void load()}>Search</Button>
          </div>
        }
      />
      <SectionCard title="Payments" description="Amounts are recorded in AUD.">
        {!data ? (
          <LoadingState rows={4} label="Loading payments" />
        ) : data.payments.length === 0 ? (
          <EmptyState
            title="No matching payments"
            description="Payments will appear after Checkout events are processed."
          />
        ) : (
          <div className="divide-y rounded-md border">
            {data.payments.map((p) => (
              <div key={p.id} className="grid gap-2 p-4 lg:grid-cols-[1fr_1fr_auto]">
                <div>
                  <p className="font-medium">{p.product_name ?? "Pending purchase"}</p>
                  <p className="text-sm text-muted-foreground">{p.email}</p>
                </div>
                <div className="text-sm">
                  <p>{p.stripe_payment_intent_id ?? "Free checkout"}</p>
                  <p>Entitlement: {p.entitlement_status ?? "not fulfilled"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <strong>{formatPrice(p.amount / 100)}</strong>
                  {p.entitlement_id && p.entitlement_status === "active" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await paymentsApi("cancel-entitlement", { id: p.entitlement_id });
                        await load();
                      }}
                    >
                      Cancel unused
                    </Button>
                  ) : null}
                  {!p.entitlement_id ? (
                    <Button
                      size="sm"
                      onClick={async () => {
                        await paymentsApi("retry-fulfilment", { id: p.checkout_session_id });
                        await load();
                      }}
                    >
                      Retry fulfilment
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
      <SectionCard
        title="Webhook events"
        description="Duplicate delivery attempts are tracked idempotently."
      >
        <div className="space-y-2">
          {data?.events.map((e) => (
            <div key={e.stripe_event_id} className="rounded-md border p-3 text-sm">
              <strong>{e.event_type}</strong> · {e.status} · attempts {e.attempts}
              <p className="break-all text-muted-foreground">
                {e.stripe_event_id}
                {e.error_message ? ` — ${e.error_message}` : ""}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}

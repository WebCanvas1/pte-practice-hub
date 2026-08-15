import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, SectionCard, EmptyState, LoadingState } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
import { formatPrice, siteConfig } from "@/config/site";
import { fetchPurchases, type Purchase } from "@/lib/payments-api";
export const Route = createFileRoute("/student/purchases")({
  head: () => ({ meta: [{ title: `Purchases — ${siteConfig.name}` }] }),
  component: Page,
});
function Page() {
  const [rows, setRows] = useState<Purchase[] | null>(null);
  useEffect(() => {
    void fetchPurchases().then((v) => setRows(v.purchases));
  }, []);
  return (
    <>
      <PageHeader
        title="Purchase history"
        description="Receipts for your securely completed test purchases."
      />
      <SectionCard title="Purchases" description="Amounts are recorded in Australian dollars.">
        {!rows ? (
          <LoadingState rows={3} label="Loading purchases" />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No purchases yet"
            description="Purchased tests and receipts will appear here."
          />
        ) : (
          <div className="divide-y rounded-md border">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{r.product_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(r.purchased_at).toLocaleString()} · {r.entitlement_status ?? r.status}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <strong>{formatPrice(r.amount / 100)}</strong>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/student/receipt/$purchaseId" params={{ purchaseId: r.id }}>
                      Receipt
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}

import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, SectionCard, EmptyState, LoadingState } from "@/components/common/ui-blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice, siteConfig } from "@/config/site";
import { paymentsApi } from "@/lib/payments-api";

interface Product {
  id: string;
  name: string;
  unit_amount: number;
  currency: string;
}
interface Coupon {
  id: string;
  code: string;
  discount_type: "fixed" | "percentage";
  amount_off: number | null;
  percent_off: number | null;
  expires_at: string | null;
  usage_limit: number | null;
  times_used: number;
  is_active: number;
}
interface Catalog {
  products: Product[];
  coupons: Coupon[];
  refunds: unknown[];
}
export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: `Pricing & coupons — ${siteConfig.name}` }] }),
  component: Page,
});
function Page() {
  const [data, setData] = useState<Catalog | null>(null);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"fixed" | "percentage">("percentage");
  const [value, setValue] = useState("10");
  const [expiry, setExpiry] = useState("");
  const [limit, setLimit] = useState("");
  const load = () => paymentsApi<Catalog>("catalog-admin").then(setData);
  useEffect(() => {
    void load();
  }, []);
  async function create() {
    await paymentsApi("coupon-create", {
      code,
      discountType: kind,
      ...(kind === "fixed"
        ? { amountOff: Math.round(Number(value) * 100) }
        : { percentOff: Number(value) }),
      expiresAt: expiry ? new Date(expiry).toISOString() : null,
      usageLimit: limit ? Number(limit) : null,
      productIds: [],
    });
    toast.success("Coupon created.");
    setCode("");
    await load();
  }
  return (
    <>
      <PageHeader
        title="Pricing & coupons"
        description="D1 prices are authoritative; changing a price preserves historical receipts."
      />
      <SectionCard title="Active prices" description="Enter prices in Australian dollars.">
        {!data ? (
          <LoadingState rows={3} label="Loading catalogue" />
        ) : (
          <div className="space-y-3">
            {data.products.map((p) => (
              <PriceRow key={p.id} product={p} reload={load} />
            ))}
          </div>
        )}
      </SectionCard>
      <SectionCard
        title="Create coupon"
        description="Leave applicable products empty to allow all products."
      >
        <div className="grid gap-3 md:grid-cols-5">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CODE"
          />
          <select
            className="rounded-md border bg-background px-3"
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed AUD</option>
          </select>
          <Input
            type="number"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
          />
          <Input type="datetime-local" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          <Input
            type="number"
            min="1"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="Usage limit"
          />
        </div>
        <Button className="mt-3" disabled={!code || !Number(value)} onClick={() => void create()}>
          Create coupon
        </Button>
      </SectionCard>
      <SectionCard
        title="Coupon history"
        description="Expired and disabled codes remain visible for audit purposes."
      >
        {!data ? (
          <LoadingState rows={3} label="Loading coupons" />
        ) : data.coupons.length === 0 ? (
          <EmptyState title="No coupons configured" description="Create the first coupon above." />
        ) : (
          <div className="divide-y rounded-md border">
            {data.coupons.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <div>
                  <strong>{c.code}</strong>
                  <p className="text-sm text-muted-foreground">
                    {c.discount_type === "fixed"
                      ? formatPrice((c.amount_off ?? 0) / 100)
                      : `${c.percent_off}%`}{" "}
                    · used {c.times_used}
                    {c.usage_limit ? `/${c.usage_limit}` : ""}
                    {c.expires_at ? ` · expires ${new Date(c.expires_at).toLocaleString()}` : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await paymentsApi("coupon-toggle", { id: c.id, active: !c.is_active });
                    await load();
                  }}
                >
                  {c.is_active ? "Disable" : "Enable"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </>
  );
}
function PriceRow({ product, reload }: { product: Product; reload: () => Promise<void> }) {
  const [amount, setAmount] = useState(String(product.unit_amount / 100));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
      <div>
        <strong>{product.name}</strong>
        <p className="text-sm text-muted-foreground">
          Current: {formatPrice(product.unit_amount / 100)}
        </p>
      </div>
      <div className="flex gap-2">
        <Input
          className="w-28"
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button
          variant="outline"
          onClick={async () => {
            await paymentsApi("price-update", {
              productId: product.id,
              unitAmount: Math.round(Number(amount) * 100),
            });
            toast.success("Price updated.");
            await reload();
          }}
        >
          Update
        </Button>
      </div>
    </div>
  );
}

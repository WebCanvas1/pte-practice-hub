import { ApiError } from "./api";

const BASE = "/api/public/payments";

function csrfToken() {
  return document.cookie
    .split(";")
    .map((part) => part.trim().split("="))
    .find(([key]) => key === "pte_csrf")?.[1];
}

export async function paymentsApi<T>(action: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE}/${action}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(csrfToken() ? { "x-csrf-token": decodeURIComponent(csrfToken()!) } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new ApiError(response.status, payload.error ?? "Payment request failed.");
  return payload;
}

export interface Purchase {
  id: string;
  product_name: string;
  amount: number;
  currency: string;
  status: string;
  purchased_at: string;
  entitlement_status: string | null;
}

export const createCheckout = (templateId: string, couponCode?: string) =>
  paymentsApi<{ url: string; checkoutId: string; free: boolean }>("checkout", {
    templateId,
    ...(couponCode ? { couponCode } : {}),
  });

export const fetchPurchases = () => paymentsApi<{ purchases: Purchase[] }>("purchases");
export const fetchReceipt = (id: string) =>
  paymentsApi<{ receipt: Purchase & { stripe_payment_intent_id: string | null } }>(
    `receipt?id=${encodeURIComponent(id)}`,
  );

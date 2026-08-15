import { z } from "zod";
import { appUrl, type D1Database, type WorkerEnv } from "./bindings.server";
import { createContext, requireRole, requireUser } from "./auth.server";
import { newId } from "./crypto.server";
import { assertCsrf, errorResponse, HttpError, json, parseBody } from "./http.server";
import { verifyStripeSignature } from "./stripe-signature.server";

const checkoutSchema = z.object({
  templateId: z.string().min(3),
  couponCode: z.string().trim().max(40).optional(),
});
const idSchema = z.object({ id: z.string().min(3) });
const adminUpdateSchema = z.object({
  id: z.string().min(3),
  status: z.enum(["pending", "succeeded", "failed", "cancelled"]),
  reason: z.string().max(500).optional(),
});

interface StripeSession {
  id: string;
  url: string | null;
  payment_status: string;
  payment_intent: string | null;
  amount_total: number | null;
  currency: string | null;
  metadata?: Record<string, string>;
}
interface StripeEvent {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: StripeSession };
}

async function stripeRequest<T>(
  env: WorkerEnv,
  path: string,
  body: URLSearchParams,
  idempotencyKey?: string,
): Promise<T> {
  if (!env.STRIPE_SECRET_KEY) throw new HttpError(503, "Stripe Checkout is not configured yet.");
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body,
  });
  const value = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok)
    throw new HttpError(502, value.error?.message ?? "Stripe could not create the checkout.");
  return value;
}

async function fulfill(
  DB: D1Database,
  checkoutId: string,
  paymentIntent: string | null,
): Promise<string> {
  const session = await DB.prepare(
    `SELECT cs.*,p.name product_name FROM checkout_sessions cs JOIN products p ON p.id=cs.product_id WHERE cs.id=?`,
  )
    .bind(checkoutId)
    .first<Record<string, unknown>>();
  if (!session) throw new Error("Checkout record not found.");
  const existing = await DB.prepare(`SELECT id FROM purchases WHERE checkout_session_id=?`)
    .bind(checkoutId)
    .first<{ id: string }>();
  if (existing) return existing.id;
  const now = new Date().toISOString();
  const paymentId = newId("pay");
  const purchaseId = newId("pur");
  const testEntitlementId = newId("ent");
  const entitlementId = newId("pent");
  await DB.prepare(
    `INSERT INTO payments (id,checkout_session_id,user_id,stripe_payment_intent_id,amount,currency,status,paid_at,created_at,updated_at) VALUES (?,?,?,?,?,?,'succeeded',?,?,?) ON CONFLICT(checkout_session_id) DO UPDATE SET status='succeeded',stripe_payment_intent_id=COALESCE(excluded.stripe_payment_intent_id,payments.stripe_payment_intent_id),paid_at=excluded.paid_at,updated_at=excluded.updated_at`,
  )
    .bind(
      paymentId,
      checkoutId,
      session["user_id"],
      paymentIntent,
      session["total"],
      session["currency"],
      now,
      now,
      now,
    )
    .run();
  const storedPayment = await DB.prepare(`SELECT id FROM payments WHERE checkout_session_id=?`)
    .bind(checkoutId)
    .first<{ id: string }>();
  await DB.prepare(
    `INSERT INTO purchases (id,user_id,payment_id,checkout_session_id,template_id,product_name,amount,currency,status,purchased_at) VALUES (?,?,?,?,?,?,?,?,'completed',?)`,
  )
    .bind(
      purchaseId,
      session["user_id"],
      storedPayment?.id ?? paymentId,
      checkoutId,
      session["template_id"],
      session["product_name"],
      session["total"],
      session["currency"],
      now,
    )
    .run();
  await DB.prepare(
    `INSERT INTO test_entitlements (id,user_id,template_id,status,source,price_paid,currency,created_at) VALUES (?,?,?,'active','stripe',?,?,?)`,
  )
    .bind(
      testEntitlementId,
      session["user_id"],
      session["template_id"],
      Number(session["total"]) / 100,
      session["currency"],
      now,
    )
    .run();
  await DB.prepare(
    `INSERT INTO entitlements (id,purchase_id,user_id,template_id,test_entitlement_id,status,created_at) VALUES (?,?,?,?,?,'active',?)`,
  )
    .bind(
      entitlementId,
      purchaseId,
      session["user_id"],
      session["template_id"],
      testEntitlementId,
      now,
    )
    .run();
  await DB.prepare(`UPDATE checkout_sessions SET status='paid',updated_at=? WHERE id=?`)
    .bind(now, checkoutId)
    .run();
  if (session["coupon_id"])
    await DB.prepare(`UPDATE coupons SET times_used=times_used+1,updated_at=? WHERE id=?`)
      .bind(now, session["coupon_id"])
      .run();
  return purchaseId;
}

async function createCheckout(request: Request, env: WorkerEnv, DB: D1Database, userId: string) {
  assertCsrf(request);
  const input = await parseBody(request, checkoutSchema);
  const template = await DB.prepare(
    `SELECT id,name,test_type,module_key,is_active,purchasable FROM test_templates WHERE id=?`,
  )
    .bind(input.templateId)
    .first<Record<string, unknown>>();
  if (!template || !template["is_active"] || !template["purchasable"])
    throw new HttpError(404, "This test is not available.");
  const productCode =
    template["test_type"] === "mock" ? "complete-mock" : `${template["module_key"]}-test`;
  const price = await DB.prepare(
    `SELECT pr.id price_id,pr.unit_amount,pr.currency,p.id product_id,p.name FROM products p JOIN prices pr ON pr.product_id=p.id WHERE p.code=? AND p.is_active=1 AND pr.is_active=1 AND pr.starts_at<=datetime('now') AND (pr.ends_at IS NULL OR pr.ends_at>datetime('now')) ORDER BY pr.starts_at DESC LIMIT 1`,
  )
    .bind(productCode)
    .first<Record<string, unknown>>();
  if (!price) throw new HttpError(409, "No active price is configured for this test.");
  let discount = 0;
  let couponId: null | string = null;
  if (input.couponCode) {
    const coupon = await DB.prepare(
      `SELECT * FROM coupons WHERE UPPER(code)=UPPER(?) AND is_active=1 AND (expires_at IS NULL OR expires_at>datetime('now')) AND (usage_limit IS NULL OR times_used<usage_limit)`,
    )
      .bind(input.couponCode)
      .first<Record<string, unknown>>();
    if (!coupon) throw new HttpError(422, "Coupon is invalid or expired.");
    const applicable = JSON.parse(String(coupon["applicable_products_json"] ?? "[]")) as string[];
    if (applicable.length && !applicable.includes(String(price["product_id"])))
      throw new HttpError(422, "Coupon does not apply to this test.");
    couponId = String(coupon["id"]);
    discount =
      coupon["discount_type"] === "percentage"
        ? Math.round((Number(price["unit_amount"]) * Number(coupon["percent_off"])) / 100)
        : Number(coupon["amount_off"] ?? 0);
  }
  const total = Math.max(0, Number(price["unit_amount"]) - discount);
  const checkoutId = newId("chk");
  const idempotencyKey = `checkout:${userId}:${checkoutId}`;
  const now = new Date().toISOString();
  await DB.prepare(
    `INSERT INTO checkout_sessions (id,user_id,template_id,product_id,price_id,coupon_id,subtotal,discount,total,currency,status,idempotency_key,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?, 'creating',?,?,?)`,
  )
    .bind(
      checkoutId,
      userId,
      input.templateId,
      price["product_id"],
      price["price_id"],
      couponId,
      price["unit_amount"],
      discount,
      total,
      price["currency"],
      idempotencyKey,
      now,
      now,
    )
    .run();
  if (total === 0) {
    const purchaseId = await fulfill(DB, checkoutId, null);
    return json({
      free: true,
      purchaseId,
      url: `${appUrl(env, request)}/student/payment-success?checkout=${checkoutId}`,
    });
  }
  const origin = appUrl(env, request);
  const body = new URLSearchParams({
    mode: "payment",
    success_url: `${origin}/student/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/student/payment-cancelled?checkout=${checkoutId}`,
    client_reference_id: checkoutId,
    "line_items[0][price_data][currency]": String(price["currency"]).toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(total),
    "line_items[0][price_data][product_data][name]": String(price["name"]),
    "line_items[0][quantity]": "1",
    "metadata[checkout_id]": checkoutId,
    "metadata[user_id]": userId,
    "metadata[template_id]": input.templateId,
  });
  try {
    const stripe = await stripeRequest<StripeSession>(
      env,
      "checkout/sessions",
      body,
      idempotencyKey,
    );
    await DB.prepare(
      `UPDATE checkout_sessions SET stripe_session_id=?,checkout_url=?,status='open',updated_at=? WHERE id=?`,
    )
      .bind(stripe.id, stripe.url, new Date().toISOString(), checkoutId)
      .run();
    return json({ free: false, url: stripe.url, checkoutId });
  } catch (error) {
    await DB.prepare(
      `UPDATE checkout_sessions SET status='failed',failure_message=?,updated_at=? WHERE id=?`,
    )
      .bind(
        error instanceof Error ? error.message : "Stripe failure",
        new Date().toISOString(),
        checkoutId,
      )
      .run();
    throw error;
  }
}

export async function handleStripeWebhook(request: Request): Promise<Response> {
  try {
    const ctx = await createContext();
    if (!ctx.env.DB || !ctx.env.STRIPE_WEBHOOK_SECRET)
      throw new HttpError(503, "Stripe webhook is not configured.");
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature") ?? "";
    if (!(await verifyStripeSignature(payload, signature, ctx.env.STRIPE_WEBHOOK_SECRET)))
      throw new HttpError(400, "Invalid Stripe signature.");
    const event = JSON.parse(payload) as StripeEvent;
    const existing = await ctx.env.DB.prepare(
      `SELECT status FROM webhook_events WHERE stripe_event_id=?`,
    )
      .bind(event.id)
      .first<{ status: string }>();
    if (existing?.status === "processed") return json({ received: true, duplicate: true });
    const now = new Date().toISOString();
    await ctx.env.DB.prepare(
      `INSERT INTO webhook_events (id,stripe_event_id,event_type,livemode,payload_json,status,received_at) VALUES (?,?,?,?,?,'processing',?) ON CONFLICT(stripe_event_id) DO UPDATE SET attempts=attempts+1,status='processing',error_message=NULL`,
    )
      .bind(newId("wh"), event.id, event.type, event.livemode ? 1 : 0, payload, now)
      .run();
    try {
      const session = event.data.object;
      const checkoutId = session.metadata?.["checkout_id"];
      if (
        ["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(
          event.type,
        ) &&
        session.payment_status === "paid" &&
        checkoutId
      )
        await fulfill(ctx.env.DB, checkoutId, session.payment_intent);
      if (event.type === "checkout.session.async_payment_failed" && checkoutId)
        await ctx.env.DB.prepare(
          `UPDATE checkout_sessions SET status='failed',failure_message='Delayed payment failed',updated_at=? WHERE id=?`,
        )
          .bind(now, checkoutId)
          .run();
      await ctx.env.DB.prepare(
        `UPDATE webhook_events SET status='processed',processed_at=? WHERE stripe_event_id=?`,
      )
        .bind(now, event.id)
        .run();
      return json({ received: true });
    } catch (error) {
      await ctx.env.DB.prepare(
        `UPDATE webhook_events SET status='failed',error_message=? WHERE stripe_event_id=?`,
      )
        .bind(error instanceof Error ? error.message : "Fulfilment failed", event.id)
        .run();
      return json({ received: true, fulfilment: "failed" }, { status: 500 });
    }
  } catch (error) {
    return errorResponse(error);
  }
}

export async function handlePaymentRequest(request: Request, action: string): Promise<Response> {
  try {
    const ctx = await createContext();
    const DB = ctx.env.DB;
    if (!DB) throw new HttpError(503, "Payments require D1.");
    if (action === "checkout" && request.method === "POST") {
      const user = await requireUser(ctx, request);
      return createCheckout(request, ctx.env, DB, user.id);
    }
    if (action === "purchases" && request.method === "GET") {
      const user = await requireUser(ctx, request);
      const rows = await DB.prepare(
        `SELECT p.*,e.id entitlement_id,e.status entitlement_status FROM purchases p LEFT JOIN entitlements e ON e.purchase_id=p.id WHERE p.user_id=? ORDER BY p.purchased_at DESC`,
      )
        .bind(user.id)
        .all();
      return json({ purchases: rows.results });
    }
    if (action === "receipt" && request.method === "GET") {
      const user = await requireUser(ctx, request);
      const id = new URL(request.url).searchParams.get("id") ?? "";
      const row = await DB.prepare(
        `SELECT p.*,pay.stripe_payment_intent_id,e.status entitlement_status FROM purchases p LEFT JOIN payments pay ON pay.id=p.payment_id LEFT JOIN entitlements e ON e.purchase_id=p.id WHERE p.id=? AND p.user_id=?`,
      )
        .bind(id, user.id)
        .first();
      if (!row) throw new HttpError(404, "Receipt not found.");
      return json({ receipt: row });
    }
    if (action === "admin" && request.method === "GET") {
      await requireRole(ctx, request, "admin");
      const q = `%${new URL(request.url).searchParams.get("q") ?? ""}%`;
      const [payments, events] = await Promise.all([
        DB.prepare(
          `SELECT pay.*,u.email,p.product_name,e.id entitlement_id,e.status entitlement_status FROM payments pay JOIN users u ON u.id=pay.user_id LEFT JOIN purchases p ON p.payment_id=pay.id LEFT JOIN entitlements e ON e.purchase_id=p.id WHERE u.email LIKE ? OR pay.id LIKE ? OR COALESCE(pay.stripe_payment_intent_id,'') LIKE ? ORDER BY pay.created_at DESC LIMIT 100`,
        )
          .bind(q, q, q)
          .all(),
        DB.prepare(
          `SELECT stripe_event_id,event_type,status,attempts,error_message,received_at FROM webhook_events ORDER BY received_at DESC LIMIT 100`,
        ).all(),
      ]);
      return json({ payments: payments.results, events: events.results });
    }
    if (action === "cancel-entitlement" && request.method === "POST") {
      const admin = await requireRole(ctx, request, "admin");
      void admin;
      assertCsrf(request);
      const { id } = await parseBody(request, idSchema);
      const row = await DB.prepare(
        `SELECT e.*,te.attempt_id FROM entitlements e JOIN test_entitlements te ON te.id=e.test_entitlement_id WHERE e.id=?`,
      )
        .bind(id)
        .first<Record<string, unknown>>();
      if (!row) throw new HttpError(404, "Entitlement not found.");
      if (row["attempt_id"]) throw new HttpError(409, "Used entitlements cannot be cancelled.");
      const now = new Date().toISOString();
      await DB.prepare(`UPDATE entitlements SET status='cancelled',cancelled_at=? WHERE id=?`)
        .bind(now, id)
        .run();
      await DB.prepare(`UPDATE test_entitlements SET status='expired' WHERE id=?`)
        .bind(row["test_entitlement_id"])
        .run();
      return json({ ok: true });
    }
    if (action === "refund-status" && request.method === "POST") {
      await requireRole(ctx, request, "admin");
      assertCsrf(request);
      const input = await parseBody(request, adminUpdateSchema);
      const pay = await DB.prepare(`SELECT * FROM payments WHERE id=?`)
        .bind(input.id)
        .first<Record<string, unknown>>();
      if (!pay) throw new HttpError(404, "Payment not found.");
      const now = new Date().toISOString();
      await DB.prepare(
        `INSERT INTO refunds (id,payment_id,amount,currency,status,reason,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`,
      )
        .bind(
          newId("ref"),
          input.id,
          pay["amount"],
          pay["currency"],
          input.status,
          input.reason ?? null,
          now,
          now,
        )
        .run();
      return json({ ok: true });
    }
    if (action === "retry-fulfilment" && request.method === "POST") {
      await requireRole(ctx, request, "admin");
      assertCsrf(request);
      const { id } = await parseBody(request, idSchema);
      const purchaseId = await fulfill(DB, id, null);
      return json({ purchaseId });
    }
    return json({ error: "Unknown payment endpoint." }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}

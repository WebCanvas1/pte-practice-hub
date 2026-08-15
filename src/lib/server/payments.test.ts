import assert from "node:assert/strict";
import test from "node:test";
import { verifyStripeSignature } from "./stripe-signature.server.ts";

test("accepts a valid Stripe signature and rejects tampering", async () => {
  const secret = "whsec_test_secret";
  const timestamp = 1_700_000_000;
  const payload = JSON.stringify({ id: "evt_duplicate", type: "checkout.session.completed" });
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const signature = [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const header = `t=${timestamp},v1=${signature}`;
  assert.equal(await verifyStripeSignature(payload, header, secret, timestamp), true);
  assert.equal(await verifyStripeSignature(`${payload}x`, header, secret, timestamp), false);
  assert.equal(await verifyStripeSignature(payload, header, secret, timestamp + 301), false);
});

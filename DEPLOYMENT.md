# Deployment & local development

## Local development

```bash
npm install
npm run dev        # http://localhost:8080
```

Without a D1 binding the auth API automatically uses an in-memory store
(`storage: "memory"` in `GET /api/public/auth/session`), so registration, login,
verification and password reset work locally. Verification / reset links are
printed to the server console and returned as `devLink` in dev responses.

Run against real Cloudflare bindings:

```bash
npm run build
npx wrangler d1 create pte_portal
npx wrangler kv namespace create SETTINGS_KV
npx wrangler kv namespace create SESSIONS_KV
npx wrangler r2 bucket create pte-portal-media
# paste the returned ids into wrangler.toml
npx wrangler d1 migrations apply pte_portal --local
npx wrangler dev
```

## Cloudflare deployment (GitHub → Workers)

1. Push the repo to GitHub and connect it in Cloudflare Workers Builds.
2. Build command `npm run build`, deploy command `npx nitro deploy --prebuilt`.
   (Nitro generates `dist/server/wrangler.json` and overrides `main`/`assets`
   from `wrangler.toml`; bindings and vars in `wrangler.toml` are still used.)
3. Apply migrations to the remote database:
   `npx wrangler d1 migrations apply pte_portal --remote`
4. Set secrets (below), then create the first administrator:

```bash
curl -X POST https://<app>/api/public/auth/admin-setup \
  -H 'content-type: application/json' \
  -d '{"setupSecret":"<ADMIN_SETUP_SECRET>","firstName":"Site","lastName":"Admin",
       "email":"admin@example.com","password":"<strong password>","confirmPassword":"<strong password>"}'
```

The route refuses to run once an admin exists, and only works when
`ADMIN_SETUP_SECRET` is configured. No admin credentials exist in frontend code.

## Required secrets (`wrangler secret put <NAME>`)

| Secret                   | Purpose                                               |
| ------------------------ | ----------------------------------------------------- |
| `SESSION_SECRET`         | reserved for signed/rotated session material          |
| `ADMIN_SETUP_SECRET`     | one-time admin bootstrap route                        |
| `STRIPE_SECRET_KEY`      | Stripe Checkout API key (`sk_test_...` for test mode) |
| `STRIPE_WEBHOOK_SECRET`  | Stripe endpoint signing secret (`whsec_...`)          |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...` for test mode)  |
| `EMAIL_API_KEY`          | Optional Resend API key for payment confirmations     |
| `CLOUDFLARE_ACCOUNT_ID`  | CI / API tooling only                                 |

## Vars

`APP_URL`, `SUPPORT_EMAIL` (set in `wrangler.toml` `[vars]`).

When `EMAIL_API_KEY` is configured, `SUPPORT_EMAIL` must be a sender verified in
Resend. Payment fulfilment remains successful if email delivery fails; the
failure is written to Worker logs for operational follow-up.

## Stripe Checkout and webhooks

Use Stripe test-mode keys until launch. In Stripe Workbench, create a webhook
endpoint at `https://<app>/api/public/stripe/webhook` and subscribe to
`checkout.session.completed`, `checkout.session.async_payment_succeeded`, and
`checkout.session.async_payment_failed`. Copy its signing secret into
`STRIPE_WEBHOOK_SECRET`; each environment/endpoint has a different secret.

For local testing, run `stripe listen --forward-to localhost:8080/api/public/stripe/webhook`
and use the temporary `whsec_...` value printed by the Stripe CLI. A successful
return page never unlocks a test: only the verified webhook (or a server-validated
zero-total checkout) creates an entitlement. Re-send the same event from Stripe
Workbench to verify duplicate delivery remains idempotent, test a successful
Checkout with Stripe's test card `4242 4242 4242 4242`, cancel a second Checkout,
and confirm neither the return URL nor a cancelled session can start a test.

Apply `migrations/0011_stripe_payments.sql` before enabling Checkout. Product
and active-price rows in D1 are authoritative; the browser never submits an
amount. Future price changes should insert a new active `prices` row and retire
the old row, preserving historical receipts.

## Bindings

| Binding       | Type | Use                                                                                                                                     |
| ------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `DB`          | D1   | users, user_profiles, user_sessions, password_reset_tokens, email_verification_tokens, roles, user_roles, audit_logs, platform_settings |
| `SETTINGS_KV` | KV   | platform settings / cached config                                                                                                       |
| `SESSIONS_KV` | KV   | login rate-limit counters, session lookups                                                                                              |
| `MEDIA`       | R2   | future audio recordings and media                                                                                                       |

## API surface

`/api/public/auth/<action>` — `session` (GET), `register`, `login`, `logout`,
`logout-all`, `forgot-password`, `reset-password`, `change-password`,
`verify-email`, `resend-verification`, `profile`, `email-preferences`,
`request-deletion`, `audit-logs` (GET, admin only), `admin-setup`.

Security: PBKDF2-SHA256 password hashing (WebCrypto), HTTP-only + Secure +
SameSite=Lax session cookies, hashed session/reset/verification tokens,
origin + double-submit CSRF checks, Zod validation on every payload, server-side
role checks, login rate limiting with temporary account lockout, session
revocation on password change/reset, and audit logging of all auth events.

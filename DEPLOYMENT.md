# Cloudflare production deployment

The portal is a TanStack Start application running in one Cloudflare Worker. Static assets are served by Workers Static Assets; server routes use D1, R2, KV, Queues, Workflows and Workers AI. Preview and production resources must be isolated.

## Prerequisites

Install Bun and authenticate Wrangler with `bunx wrangler login`. Replace every `REPLACE_*` value in `wrangler.jsonc` before using preview. Keep secrets out of Git and Cloudflare build variables marked as plain text.

## Exact setup

1. **Create the Worker project.** In Cloudflare Workers & Pages choose Create > Import a repository, select this GitHub repository, and leave deployment disabled until resources are ready. Use build command `bun run build:production` and deploy command `bun run deploy:production`.
2. **Create D1.** Run `bunx wrangler d1 create pte_portal` and `bunx wrangler d1 create pte_portal_preview`. Put the returned IDs in the matching `wrangler.jsonc` environments.
3. **Apply migrations.** Run `bunx wrangler d1 migrations apply pte_portal --remote --env production`. Run the same command for `pte_portal_preview --env preview`. Take a D1 backup before later schema changes and apply migrations sequentially; never edit an already-applied migration.
4. **Create R2.** Run `bunx wrangler r2 bucket create pte-portal-media` and `bunx wrangler r2 bucket create pte-portal-media-preview`. Originals, question media and speaking recordings remain private and are served only through authorised Worker routes.
5. **Create KV.** Create `SETTINGS_KV` and `SESSIONS_KV` namespaces for both environments with `bunx wrangler kv namespace create <NAME>`. Insert the IDs in each environment.
6. **Create queues.** Create `pte-content-imports`, `pte-content-imports-dlq`, and their `-preview` equivalents using `bunx wrangler queues create <name>`. The Worker retries failed imports and moves exhausted messages to the DLQ.
7. **Configure Workflows.** The `ContentImportWorkflow` class and bindings are declared in `wrangler.jsonc`. Deploy once after resources exist; uploads prefer Workflow orchestration and retain the Queue path for retryable processing.
8. **Configure Workers AI.** The `AI` binding is declared per environment. Model names are non-secret vars and can later be changed in admin settings. AI failures leave factual results intact and jobs visible for retry.
9. **Configure Vectorize (optional).** Create `pte-question-vectors` with dimensions matching the selected embedding model, add a `QUESTION_VECTORS` binding to each environment, and deploy. Until enabled, duplicate detection uses exact, normalized and D1 text-similarity checks.
10. **Add Stripe secrets.** For each environment run `bunx wrangler secret put STRIPE_SECRET_KEY --env production`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PUBLISHABLE_KEY`; repeat with test-mode values for preview. Also set `SESSION_SECRET`, `ADMIN_SETUP_SECRET`, and optional `EMAIL_API_KEY`.
11. **Add AI-provider secrets.** Workers AI needs no API key. If a future provider is selected, store its key with `wrangler secret put`; never add it to platform settings or browser variables.
12. **Deploy from GitHub.** Commit `bun.lock`. Cloudflare must run `bun install --frozen-lockfile`, `bun run build:production`, and `bun run deploy:production`. Preview uses the corresponding preview scripts/environment.
13. **Configure the custom domain.** Add the domain under Worker Settings > Domains & Routes, then change production `APP_URL` to the canonical HTTPS origin and redeploy. Redirect alternate hosts at Cloudflare and retain HSTS only after HTTPS is verified.
14. **Configure Stripe webhooks.** Create an endpoint at `https://<domain>/api/public/stripe/webhook` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, and `checkout.session.async_payment_failed`. Store that endpoint's unique signing secret. Re-send one event to verify idempotency.
15. **Create the first admin.** POST once to `/api/public/auth/admin-setup` with `setupSecret`, name, email, password and confirmation. The endpoint disables itself after an admin exists. Rotate or delete `ADMIN_SETUP_SECRET` afterwards.
16. **Run production smoke tests.** Check `/api/health`, register/login/logout, admin authorization, CSV import/approval/publication, a Stripe test checkout plus webhook entitlement, test start/submission/scoring, R2 audio access controls, empty states, report ownership, mobile layouts, and queue/DLQ visibility.

## Environments and bindings

| Binding | Service | Purpose |
| --- | --- | --- |
| `DB` | D1 | identity, content, tests, payments, results, settings, audits and jobs |
| `MEDIA` | R2 | uploads, question media and speaking recordings |
| `SETTINGS_KV` | KV | cached platform settings |
| `SESSIONS_KV` | KV | authentication throttles and session/rate-limit data |
| `AI` | Workers AI | transcription, scoring feedback and import assistance |
| `CONTENT_IMPORT_QUEUE` | Queue | retryable ingestion jobs |
| `CONTENT_IMPORT_WORKFLOW` | Workflow | durable import orchestration |
| `QUESTION_VECTORS` | Vectorize, optional | semantic duplicate candidates |
| `ASSETS` | Static Assets | hashed browser bundles |

Required secrets are `SESSION_SECRET`, `ADMIN_SETUP_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PUBLISHABLE_KEY`. `EMAIL_API_KEY` and external AI-provider keys are optional. Non-secret vars are `APP_ENV`, `APP_URL`, `SUPPORT_EMAIL`, and AI model names.

## Operations, privacy and limitations

Use the admin health and failed-job pages plus structured Worker logs (`requestId`, path, status and duration). Alert on 5xx rate, Stripe webhook failures, AI/scoring backlog, Queue DLQ depth, D1 latency, R2 errors and low question pools. Cloudflare log retention is plan-dependent; export only scrubbed operational logs and set a documented deletion period.

Speaking recordings are private R2 objects and must follow the configured audio-retention period. Account deletion must revoke sessions, remove personal rows after the grace period, and delete associated R2 objects. Public consent copy must disclose automated AI processing and link to the privacy policy. Results remain practice estimates, not official Pearson scores.

Known limitations: Vectorize and external AI Gateway are optional and not enabled in the committed configuration; transactional email depends on a configured provider; PDF export uses printable HTML; CSP currently permits inline TanStack bootstrap scripts and should move to nonce-based CSP when framework support is adopted.

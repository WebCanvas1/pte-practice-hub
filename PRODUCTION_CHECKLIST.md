# Production checklist

- [ ] Replace all preview placeholders and set the canonical production `APP_URL`.
- [ ] Confirm D1 migrations 0001–0013 are applied and take a backup.
- [ ] Confirm production/preview use separate D1, R2, KV, Queue, Workflow and Stripe resources.
- [ ] Add and rotate all required secrets; remove `ADMIN_SETUP_SECRET` after bootstrap.
- [ ] Confirm no secret is exposed in HTML, JavaScript, logs, Git, or admin API responses.
- [ ] Verify `/api/health`, admin health, structured logs, failed jobs and Queue DLQ.
- [ ] Verify CSP, HSTS, referrer, permissions, MIME-sniffing and frame protections.
- [ ] Verify same-origin/CORS checks, input validation, upload limits and auth throttling.
- [ ] Verify Stripe signature validation, duplicate delivery and entitlement protection.
- [ ] Verify every admin route rejects student and anonymous sessions server-side.
- [ ] Verify imports never publish without an explicit recorded admin approval.
- [ ] Verify account deletion removes sessions and associated R2 media after the grace period.
- [ ] Review audio/log retention, consent, AI disclosure and practice-score disclaimer.
- [ ] Run `bun run typecheck`, `bun run lint`, `bun test`, `bun run build:production` and `bun run deploy:dry-run`.
- [ ] Smoke-test checkout, import, test completion, AI fallback, reports and responsive layouts.
- [ ] Configure alerts for Worker errors, webhook failures, AI backlog, DLQ depth and D1/R2 errors.

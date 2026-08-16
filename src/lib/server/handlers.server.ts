/**
 * Auth endpoint handlers. Dispatched from
 * src/routes/api/public/auth/$action.ts (imported lazily so this
 * server-only module never reaches the client bundle).
 *
 * Email delivery is not wired up yet: verification / reset links are logged
 * server-side. When no D1 binding is present (local dev) the link is also
 * returned in the response so the flows can be exercised end to end.
 */
import { appUrl } from "./bindings.server";
import { hashPassword, newId, randomToken, sha256Hex, verifyPassword } from "./crypto.server";
import {
  CSRF_COOKIE,
  HttpError,
  assertCsrf,
  clearedSessionCookie,
  csrfCookie,
  ensureCsrfToken,
  errorResponse,
  json,
  parseBody,
  rateLimit,
  readCookie,
  resetRateLimit,
  sessionCookie,
} from "./http.server";
import {
  adminSetupSchema,
  audit,
  changePasswordSchema,
  createContext,
  currentUser,
  emailPreferencesSchema,
  forgotPasswordSchema,
  issueSession,
  loginSchema,
  profileSchema,
  registerSchema,
  requireRole,
  requireUser,
  resetPasswordSchema,
  revokeCurrentSession,
  toPublicUser,
  verifyEmailSchema,
  type AuthContext,
} from "./auth.server";
import type { TokenKind } from "./store.server";

const LOGIN_ATTEMPT_LIMIT = 8;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const ACCOUNT_LOCK_THRESHOLD = 5;
const ACCOUNT_LOCK_SECONDS = 15 * 60;
const TOKEN_TTL_SECONDS = { password_reset: 60 * 60, email_verification: 60 * 60 * 24 } as const;

type Handler = (request: Request, ctx: AuthContext) => Promise<Response>;

async function issueToken(ctx: AuthContext, kind: TokenKind, userId: string): Promise<string> {
  const token = randomToken(32);
  await ctx.store.createToken(kind, {
    id: newId(kind === "password_reset" ? "prt" : "evt"),
    user_id: userId,
    token_hash: await sha256Hex(token),
    expires_at: new Date(Date.now() + TOKEN_TTL_SECONDS[kind] * 1000).toISOString(),
    used_at: null,
    created_at: new Date().toISOString(),
  });
  return token;
}

function devLink(ctx: AuthContext, request: Request, path: string, token: string) {
  const link = `${appUrl(ctx.env, request)}${path}?token=${token}`;
  console.log(`[auth] ${path} link: ${link}`);
  return ctx.env.DB ? {} : { devLink: link };
}

async function loadPublicUser(ctx: AuthContext, userId: string) {
  const [user, profile, roles] = await Promise.all([
    ctx.store.getUserById(userId),
    ctx.store.getProfile(userId),
    ctx.store.getRoles(userId),
  ]);
  if (!user) throw new HttpError(404, "Account not found.");
  return toPublicUser(user, profile, roles);
}

/* --------------------------------- handlers -------------------------------- */

const handlers: Record<string, { method: "GET" | "POST"; handler: Handler }> = {
  session: {
    method: "GET",
    handler: async (request, ctx) => {
      const user = await currentUser(ctx, request);
      const csrf = ensureCsrfToken(request);
      const headers = new Headers();
      if (csrf.setCookie) headers.append("set-cookie", csrf.setCookie);
      return json({ user, csrfToken: csrf.token, storage: ctx.store.kind }, { headers });
    },
  },

  register: {
    method: "POST",
    handler: async (request, ctx) => {
      assertCsrf(request);
      if (ctx.env.DB) {
        const row = await ctx.env.DB.prepare(
          `SELECT value FROM platform_settings WHERE key='availability'`,
        ).first<{ value: string }>();
        if (row) {
          try {
            const availability = JSON.parse(row.value) as {
              registrationOpen?: boolean;
              maintenanceMode?: boolean;
            };
            if (availability.maintenanceMode)
              throw new HttpError(503, "Registration is unavailable during maintenance.");
            if (availability.registrationOpen === false)
              throw new HttpError(403, "New registrations are currently closed.");
          } catch (error) {
            if (error instanceof HttpError) throw error;
          }
        }
      }
      const data = await parseBody(request, registerSchema);

      const existing = await ctx.store.getUserByEmail(data.email);
      if (existing) {
        await audit(ctx, request, {
          userId: null,
          action: "auth.register",
          outcome: "failure",
          metadata: { reason: "email_taken" },
        });
        throw new HttpError(409, "Please check the highlighted fields.", {
          email: "An account with this email already exists.",
        });
      }

      const user = await ctx.store.createUser({
        email: data.email,
        passwordHash: await hashPassword(data.password),
        firstName: data.firstName,
        lastName: data.lastName,
        country: data.country,
        timezone: data.timezone,
        acceptedTermsAt: new Date().toISOString(),
        role: "student",
      });

      const verifyToken = await issueToken(ctx, "email_verification", user.id);
      const extra = devLink(ctx, request, "/verify-email", verifyToken);

      const sessionToken = await issueSession(ctx, request, user.id);
      await audit(ctx, request, {
        userId: user.id,
        action: "auth.register",
        outcome: "success",
      });

      const csrf = ensureCsrfToken(request);
      const headers = new Headers();
      headers.append("set-cookie", sessionCookie(request, sessionToken));
      if (csrf.setCookie) headers.append("set-cookie", csrf.setCookie);
      return json(
        { user: await loadPublicUser(ctx, user.id), csrfToken: csrf.token, ...extra },
        { status: 201, headers },
      );
    },
  },

  login: {
    method: "POST",
    handler: async (request, ctx) => {
      assertCsrf(request);
      const data = await parseBody(request, loginSchema);
      const rateKey = `login:${data.email}`;

      const limit = await rateLimit(rateKey, LOGIN_ATTEMPT_LIMIT, LOGIN_WINDOW_SECONDS);
      if (!limit.allowed) {
        await audit(ctx, request, {
          userId: null,
          action: "auth.login",
          outcome: "failure",
          metadata: { reason: "rate_limited", email: data.email },
        });
        throw new HttpError(429, "Too many attempts. Please try again in a few minutes.");
      }

      const user = await ctx.store.getUserByEmail(data.email);
      const genericFailure = new HttpError(401, "Email or password is incorrect.");

      if (!user) {
        await audit(ctx, request, {
          userId: null,
          action: "auth.login",
          outcome: "failure",
          metadata: { reason: "unknown_email" },
        });
        throw genericFailure;
      }

      if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
        throw new HttpError(423, "This account is temporarily locked. Try again shortly.");
      }

      if (user.status !== "active" || !(await verifyPassword(data.password, user.password_hash))) {
        const attempts = user.failed_login_attempts + 1;
        const lockedUntil =
          attempts >= ACCOUNT_LOCK_THRESHOLD
            ? new Date(Date.now() + ACCOUNT_LOCK_SECONDS * 1000).toISOString()
            : null;
        await ctx.store.recordLoginFailure(user.id, lockedUntil);
        await audit(ctx, request, {
          userId: user.id,
          action: "auth.login",
          outcome: "failure",
          metadata: { reason: "bad_credentials", attempts },
        });
        throw genericFailure;
      }

      await ctx.store.clearLoginFailures(user.id);
      await resetRateLimit(rateKey);
      const sessionToken = await issueSession(ctx, request, user.id);
      await audit(ctx, request, { userId: user.id, action: "auth.login", outcome: "success" });

      const csrf = ensureCsrfToken(request);
      const headers = new Headers();
      headers.append("set-cookie", sessionCookie(request, sessionToken));
      if (csrf.setCookie) headers.append("set-cookie", csrf.setCookie);
      return json({ user: await loadPublicUser(ctx, user.id), csrfToken: csrf.token }, { headers });
    },
  },

  logout: {
    method: "POST",
    handler: async (request, ctx) => {
      assertCsrf(request);
      const user = await currentUser(ctx, request);
      await revokeCurrentSession(ctx, request);
      if (user) {
        await audit(ctx, request, { userId: user.id, action: "auth.logout", outcome: "success" });
      }
      return json({ ok: true }, { headers: { "set-cookie": clearedSessionCookie(request) } });
    },
  },

  "logout-all": {
    method: "POST",
    handler: async (request, ctx) => {
      assertCsrf(request);
      const user = await requireUser(ctx, request);
      await ctx.store.revokeAllSessions(user.id);
      await audit(ctx, request, {
        userId: user.id,
        action: "auth.logout_all_devices",
        outcome: "success",
      });
      return json({ ok: true }, { headers: { "set-cookie": clearedSessionCookie(request) } });
    },
  },

  "forgot-password": {
    method: "POST",
    handler: async (request, ctx) => {
      assertCsrf(request);
      const data = await parseBody(request, forgotPasswordSchema);
      const limit = await rateLimit(`forgot:${data.email}`, 5, LOGIN_WINDOW_SECONDS);
      if (!limit.allowed) throw new HttpError(429, "Too many requests. Please try again later.");

      const user = await ctx.store.getUserByEmail(data.email);
      let extra: Record<string, string> = {};
      if (user) {
        const token = await issueToken(ctx, "password_reset", user.id);
        extra = devLink(ctx, request, "/reset-password", token) as Record<string, string>;
        await audit(ctx, request, {
          userId: user.id,
          action: "auth.password_reset_requested",
          outcome: "success",
        });
      }
      // Always the same answer — never reveal whether an account exists.
      return json({ ok: true, ...extra });
    },
  },

  "reset-password": {
    method: "POST",
    handler: async (request, ctx) => {
      assertCsrf(request);
      const data = await parseBody(request, resetPasswordSchema);
      const record = await ctx.store.getToken("password_reset", await sha256Hex(data.token));
      if (!record || new Date(record.expires_at).getTime() < Date.now()) {
        throw new HttpError(400, "This reset link is invalid or has expired.");
      }
      await ctx.store.updatePasswordHash(record.user_id, await hashPassword(data.password));
      await ctx.store.useToken("password_reset", record.id);
      // Password changed => every existing session is invalidated.
      await ctx.store.revokeAllSessions(record.user_id);
      await audit(ctx, request, {
        userId: record.user_id,
        action: "auth.password_reset_completed",
        outcome: "success",
      });
      return json({ ok: true }, { headers: { "set-cookie": clearedSessionCookie(request) } });
    },
  },

  "change-password": {
    method: "POST",
    handler: async (request, ctx) => {
      assertCsrf(request);
      const publicUser = await requireUser(ctx, request);
      const data = await parseBody(request, changePasswordSchema);
      const user = await ctx.store.getUserById(publicUser.id);
      if (!user || !(await verifyPassword(data.currentPassword, user.password_hash))) {
        await audit(ctx, request, {
          userId: publicUser.id,
          action: "auth.password_change",
          outcome: "failure",
        });
        throw new HttpError(422, "Please check the highlighted fields.", {
          currentPassword: "Current password is incorrect.",
        });
      }
      await ctx.store.updatePasswordHash(user.id, await hashPassword(data.password));
      await ctx.store.revokeAllSessions(user.id);
      const sessionToken = await issueSession(ctx, request, user.id);
      await audit(ctx, request, {
        userId: user.id,
        action: "auth.password_change",
        outcome: "success",
      });
      return json(
        { ok: true },
        { headers: { "set-cookie": sessionCookie(request, sessionToken) } },
      );
    },
  },

  "verify-email": {
    method: "POST",
    handler: async (request, ctx) => {
      assertCsrf(request);
      const data = await parseBody(request, verifyEmailSchema);
      const record = await ctx.store.getToken("email_verification", await sha256Hex(data.token));
      if (!record || new Date(record.expires_at).getTime() < Date.now()) {
        throw new HttpError(400, "This verification link is invalid or has expired.");
      }
      await ctx.store.markEmailVerified(record.user_id);
      await ctx.store.useToken("email_verification", record.id);
      await audit(ctx, request, {
        userId: record.user_id,
        action: "auth.email_verified",
        outcome: "success",
      });
      return json({ ok: true });
    },
  },

  "resend-verification": {
    method: "POST",
    handler: async (request, ctx) => {
      assertCsrf(request);
      const user = await requireUser(ctx, request);
      const limit = await rateLimit(`verify:${user.id}`, 3, LOGIN_WINDOW_SECONDS);
      if (!limit.allowed) throw new HttpError(429, "Please wait before requesting another email.");
      const token = await issueToken(ctx, "email_verification", user.id);
      return json({ ok: true, ...devLink(ctx, request, "/verify-email", token) });
    },
  },

  profile: {
    method: "POST",
    handler: async (request, ctx) => {
      assertCsrf(request);
      const user = await requireUser(ctx, request);
      const data = await parseBody(request, profileSchema);
      await ctx.store.updateProfile(user.id, {
        first_name: data.firstName,
        last_name: data.lastName,
        country: data.country,
        timezone: data.timezone,
      });
      await audit(ctx, request, {
        userId: user.id,
        action: "profile.updated",
        outcome: "success",
      });
      return json({ user: await loadPublicUser(ctx, user.id) });
    },
  },

  "email-preferences": {
    method: "POST",
    handler: async (request, ctx) => {
      assertCsrf(request);
      const user = await requireUser(ctx, request);
      const data = await parseBody(request, emailPreferencesSchema);
      await ctx.store.updateProfile(user.id, {
        marketing_emails: data.marketing ? 1 : 0,
        product_emails: data.product ? 1 : 0,
      });
      await audit(ctx, request, {
        userId: user.id,
        action: "profile.email_preferences_updated",
        outcome: "success",
      });
      return json({ user: await loadPublicUser(ctx, user.id) });
    },
  },

  "request-deletion": {
    method: "POST",
    handler: async (request, ctx) => {
      assertCsrf(request);
      const user = await requireUser(ctx, request);
      await ctx.store.updateProfile(user.id, {
        deletion_requested_at: new Date().toISOString(),
      });
      await audit(ctx, request, {
        userId: user.id,
        action: "account.deletion_requested",
        outcome: "success",
      });
      return json({ user: await loadPublicUser(ctx, user.id) });
    },
  },

  "audit-logs": {
    method: "GET",
    handler: async (request, ctx) => {
      const admin = await requireRole(ctx, request, "admin");
      const logs = await ctx.store.listAudit(100);
      return json({ logs, requestedBy: admin.email });
    },
  },

  "admin-setup": {
    method: "POST",
    handler: async (request, ctx) => {
      assertCsrf(request);
      const limit = await rateLimit("admin-setup", 5, LOGIN_WINDOW_SECONDS);
      if (!limit.allowed) throw new HttpError(429, "Too many attempts.");

      const data = await parseBody(request, adminSetupSchema);
      const expected = ctx.env.ADMIN_SETUP_SECRET;
      if (!expected || expected.length < 8) {
        throw new HttpError(503, "Admin setup is not enabled on this environment.");
      }
      if (data.setupSecret !== expected) {
        await audit(ctx, request, {
          userId: null,
          action: "admin.setup",
          outcome: "failure",
          metadata: { reason: "bad_secret" },
        });
        throw new HttpError(403, "Invalid setup secret.");
      }
      if ((await ctx.store.countUsersWithRole("admin")) > 0) {
        throw new HttpError(409, "An administrator already exists.");
      }

      const existing = await ctx.store.getUserByEmail(data.email);
      if (existing) {
        await ctx.store.addRole(existing.id, "admin");
        await audit(ctx, request, {
          userId: existing.id,
          action: "admin.setup",
          outcome: "success",
          metadata: { promoted: true },
        });
        return json({ ok: true, promoted: true });
      }

      const user = await ctx.store.createUser({
        email: data.email,
        passwordHash: await hashPassword(data.password),
        firstName: data.firstName,
        lastName: data.lastName,
        country: "AU",
        timezone: "Australia/Sydney",
        acceptedTermsAt: new Date().toISOString(),
        role: "admin",
        emailVerified: true,
      });
      await audit(ctx, request, {
        userId: user.id,
        action: "admin.setup",
        outcome: "success",
        metadata: { created: true },
      });
      return json({ ok: true, created: true }, { status: 201 });
    },
  },
};

export async function handleAuthRequest(request: Request, action: string): Promise<Response> {
  try {
    const entry = handlers[action];
    if (!entry) return json({ error: "Unknown endpoint." }, { status: 404 });
    if (entry.method !== request.method) {
      return json({ error: "Method not allowed." }, { status: 405 });
    }
    const ctx = await createContext();
    return await entry.handler(request, ctx);
  } catch (error) {
    return errorResponse(error);
  }
}

/** Exported for the CSRF cookie name used by the client helper. */
export const csrfCookieName = CSRF_COOKIE;
export const csrfHelpers = { csrfCookie, readCookie };

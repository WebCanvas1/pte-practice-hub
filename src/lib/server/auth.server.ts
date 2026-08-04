/**
 * Session management, role guards, validation schemas and audit logging.
 * Everything here is server-only.
 */
import { z } from "zod";

import { getWorkerEnv, type WorkerEnv } from "./bindings.server";
import { newId, randomToken, sha256Hex } from "./crypto.server";
import {
  HttpError,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  clientIp,
  readCookie,
  userAgent,
} from "./http.server";
import { getStore, type ProfileRow, type RoleKey, type Store, type UserRow } from "./store.server";

export interface PublicUser {
  id: string;
  email: string;
  emailVerified: boolean;
  role: RoleKey;
  roles: RoleKey[];
  firstName: string;
  lastName: string;
  country: string;
  timezone: string;
  emailPreferences: { marketing: boolean; product: boolean };
  deletionRequested: boolean;
}

/** Only whitelisted fields ever leave the server — no hashes, no lock state. */
export function toPublicUser(user: UserRow, profile: ProfileRow | null, roles: RoleKey[]): PublicUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.email_verified === 1,
    role: roles.includes("admin") ? "admin" : "student",
    roles,
    firstName: profile?.first_name ?? "",
    lastName: profile?.last_name ?? "",
    country: profile?.country ?? "",
    timezone: profile?.timezone ?? "",
    emailPreferences: {
      marketing: (profile?.marketing_emails ?? 0) === 1,
      product: (profile?.product_emails ?? 1) === 1,
    },
    deletionRequested: Boolean(profile?.deletion_requested_at),
  };
}

export interface AuthContext {
  env: WorkerEnv;
  store: Store;
}

export async function createContext(): Promise<AuthContext> {
  const env = await getWorkerEnv();
  return { env, store: getStore(env) };
}

export async function audit(
  ctx: AuthContext,
  request: Request,
  input: { userId: string | null; action: string; outcome: "success" | "failure"; metadata?: Record<string, unknown> },
): Promise<void> {
  try {
    await ctx.store.addAudit({
      id: newId("aud"),
      user_id: input.userId,
      action: input.action,
      outcome: input.outcome,
      ip_address: clientIp(request),
      user_agent: userAgent(request),
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Auditing must never break the request it is recording.
    console.error("[auth] audit write failed", error);
  }
}

export async function issueSession(
  ctx: AuthContext,
  request: Request,
  userId: string,
): Promise<string> {
  const token = randomToken(32);
  const tokenHash = await sha256Hex(token);
  const nowMs = Date.now();
  await ctx.store.createSession({
    id: newId("ses"),
    user_id: userId,
    token_hash: tokenHash,
    expires_at: new Date(nowMs + SESSION_TTL_SECONDS * 1000).toISOString(),
    created_at: new Date(nowMs).toISOString(),
    ip_address: clientIp(request),
    user_agent: userAgent(request),
    revoked_at: null,
  });
  return token;
}

export async function currentUser(
  ctx: AuthContext,
  request: Request,
): Promise<PublicUser | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const session = await ctx.store.getSessionByTokenHash(tokenHash);
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await ctx.store.revokeSession(tokenHash);
    return null;
  }
  const user = await ctx.store.getUserById(session.user_id);
  if (!user || user.status !== "active") return null;
  const [profile, roles] = await Promise.all([
    ctx.store.getProfile(user.id),
    ctx.store.getRoles(user.id),
  ]);
  return toPublicUser(user, profile, roles);
}

export async function requireUser(ctx: AuthContext, request: Request): Promise<PublicUser> {
  const user = await currentUser(ctx, request);
  if (!user) throw new HttpError(401, "You need to be signed in.");
  return user;
}

export async function requireRole(
  ctx: AuthContext,
  request: Request,
  role: RoleKey,
): Promise<PublicUser> {
  const user = await requireUser(ctx, request);
  if (!user.roles.includes(role)) throw new HttpError(403, "You do not have access to this area.");
  return user;
}

export async function revokeCurrentSession(ctx: AuthContext, request: Request): Promise<void> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return;
  await ctx.store.revokeSession(await sha256Hex(token));
}

/* --------------------------------- schemas -------------------------------- */

const emailSchema = z
  .string()
  .trim()
  .min(5, "Enter your email address.")
  .max(254)
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Use 128 characters or fewer.")
  .refine((v) => /[a-z]/.test(v), "Include a lowercase letter.")
  .refine((v) => /[A-Z]/.test(v), "Include an uppercase letter.")
  .refine((v) => /[0-9]/.test(v), "Include a number.");

const nameSchema = z.string().trim().min(1, "This field is required.").max(60);

export const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    country: z.string().trim().min(2, "Select your country.").max(60),
    timezone: z.string().trim().min(3, "Select your timezone.").max(60),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms and Privacy Policy." }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10, "This reset link is invalid."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const verifyEmailSchema = z.object({ token: z.string().min(10, "Invalid link.") });

export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  country: z.string().trim().min(2, "Select your country.").max(60),
  timezone: z.string().trim().min(3, "Select your timezone.").max(60),
});

export const emailPreferencesSchema = z.object({
  marketing: z.boolean(),
  product: z.boolean(),
});

export const adminSetupSchema = z
  .object({
    setupSecret: z.string().min(8, "Setup secret is required."),
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

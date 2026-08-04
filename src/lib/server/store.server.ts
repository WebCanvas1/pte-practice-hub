/**
 * Data access layer.
 *
 * Production runs against Cloudflare D1 (see `migrations/`). When no D1
 * binding is present (local `vite dev` / preview, which is plain Node), an
 * in-memory store with identical semantics is used so the auth flows are
 * fully testable without wrangler. Both implement the same `Store` contract,
 * so route handlers never branch on the environment.
 */
import type { D1Database, WorkerEnv } from "./bindings.server";
import { newId } from "./crypto.server";

export type RoleKey = "student" | "admin";
export type TokenKind = "password_reset" | "email_verification";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  email_verified: number;
  status: string;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  user_id: string;
  first_name: string;
  last_name: string;
  country: string;
  timezone: string;
  marketing_emails: number;
  product_emails: number;
  accepted_terms_at: string | null;
  deletion_requested_at: string | null;
}

export interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
  revoked_at: string | null;
}

export interface TokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface AuditRow {
  id: string;
  user_id: string | null;
  action: string;
  outcome: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: string | null;
  created_at: string;
}

export interface Store {
  readonly kind: "d1" | "memory";
  createUser: (input: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    country: string;
    timezone: string;
    acceptedTermsAt: string;
    role: RoleKey;
    emailVerified?: boolean;
  }) => Promise<UserRow>;
  getUserByEmail: (email: string) => Promise<UserRow | null>;
  getUserById: (id: string) => Promise<UserRow | null>;
  countUsersWithRole: (role: RoleKey) => Promise<number>;
  updatePasswordHash: (userId: string, passwordHash: string) => Promise<void>;
  markEmailVerified: (userId: string) => Promise<void>;
  recordLoginFailure: (userId: string, lockedUntil: string | null) => Promise<void>;
  clearLoginFailures: (userId: string) => Promise<void>;
  getProfile: (userId: string) => Promise<ProfileRow | null>;
  updateProfile: (userId: string, patch: Partial<ProfileRow>) => Promise<void>;
  getRoles: (userId: string) => Promise<RoleKey[]>;
  addRole: (userId: string, role: RoleKey) => Promise<void>;
  createSession: (row: SessionRow) => Promise<void>;
  getSessionByTokenHash: (tokenHash: string) => Promise<SessionRow | null>;
  revokeSession: (tokenHash: string) => Promise<void>;
  revokeAllSessions: (userId: string) => Promise<void>;
  createToken: (kind: TokenKind, row: TokenRow) => Promise<void>;
  getToken: (kind: TokenKind, tokenHash: string) => Promise<TokenRow | null>;
  useToken: (kind: TokenKind, id: string) => Promise<void>;
  addAudit: (row: AuditRow) => Promise<void>;
  listAudit: (limit: number) => Promise<AuditRow[]>;
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<void>;
}

const now = () => new Date().toISOString();

const tokenTable = (kind: TokenKind) =>
  kind === "password_reset" ? "password_reset_tokens" : "email_verification_tokens";

/* -------------------------------------------------------------------------- */
/* D1                                                                          */
/* -------------------------------------------------------------------------- */

function createD1Store(db: D1Database): Store {
  const first = <T>(sql: string, ...args: unknown[]) =>
    db
      .prepare(sql)
      .bind(...args)
      .first<T>();
  const run = (sql: string, ...args: unknown[]) =>
    db
      .prepare(sql)
      .bind(...args)
      .run();

  return {
    kind: "d1",
    async createUser(input) {
      const id = newId("usr");
      const ts = now();
      await run(
        `INSERT INTO users (id, email, password_hash, email_verified, status, failed_login_attempts, locked_until, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'active', 0, NULL, ?, ?)`,
        id,
        input.email,
        input.passwordHash,
        input.emailVerified ? 1 : 0,
        ts,
        ts,
      );
      await run(
        `INSERT INTO user_profiles (user_id, first_name, last_name, country, timezone, marketing_emails, product_emails, accepted_terms_at, deletion_requested_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, 1, ?, NULL, ?, ?)`,
        id,
        input.firstName,
        input.lastName,
        input.country,
        input.timezone,
        input.acceptedTermsAt,
        ts,
        ts,
      );
      await run(
        `INSERT INTO user_roles (user_id, role_key, created_at) VALUES (?, ?, ?)`,
        id,
        input.role,
        ts,
      );
      const user = await first<UserRow>(`SELECT * FROM users WHERE id = ?`, id);
      if (!user) throw new Error("Failed to create user");
      return user;
    },
    getUserByEmail: (email) =>
      first<UserRow>(`SELECT * FROM users WHERE email = ?`, email).then((r) => r ?? null),
    getUserById: (id) =>
      first<UserRow>(`SELECT * FROM users WHERE id = ?`, id).then((r) => r ?? null),
    async countUsersWithRole(role) {
      const row = await first<{ count: number }>(
        `SELECT COUNT(*) AS count FROM user_roles WHERE role_key = ?`,
        role,
      );
      return row?.count ?? 0;
    },
    async updatePasswordHash(userId, passwordHash) {
      await run(
        `UPDATE users SET password_hash = ?, updated_at = ?, failed_login_attempts = 0, locked_until = NULL WHERE id = ?`,
        passwordHash,
        now(),
        userId,
      );
    },
    async markEmailVerified(userId) {
      await run(`UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?`, now(), userId);
    },
    async recordLoginFailure(userId, lockedUntil) {
      await run(
        `UPDATE users SET failed_login_attempts = failed_login_attempts + 1, locked_until = ?, updated_at = ? WHERE id = ?`,
        lockedUntil,
        now(),
        userId,
      );
    },
    async clearLoginFailures(userId) {
      await run(
        `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`,
        now(),
        userId,
      );
    },
    getProfile: (userId) =>
      first<ProfileRow>(`SELECT * FROM user_profiles WHERE user_id = ?`, userId).then(
        (r) => r ?? null,
      ),
    async updateProfile(userId, patch) {
      const allowed: (keyof ProfileRow)[] = [
        "first_name",
        "last_name",
        "country",
        "timezone",
        "marketing_emails",
        "product_emails",
        "deletion_requested_at",
      ];
      const entries = allowed
        .filter((key) => patch[key] !== undefined)
        .map((key) => [key, patch[key]] as const);
      if (entries.length === 0) return;
      const setSql = entries.map(([key]) => `${key} = ?`).join(", ");
      await run(
        `UPDATE user_profiles SET ${setSql}, updated_at = ? WHERE user_id = ?`,
        ...entries.map(([, value]) => value),
        now(),
        userId,
      );
    },
    async getRoles(userId) {
      const rows = await db
        .prepare(`SELECT role_key FROM user_roles WHERE user_id = ?`)
        .bind(userId)
        .all<{ role_key: RoleKey }>();
      return rows.results.map((r) => r.role_key);
    },
    async addRole(userId, role) {
      await run(
        `INSERT OR IGNORE INTO user_roles (user_id, role_key, created_at) VALUES (?, ?, ?)`,
        userId,
        role,
        now(),
      );
    },
    async createSession(row) {
      await run(
        `INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at, ip_address, user_agent, revoked_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
        row.id,
        row.user_id,
        row.token_hash,
        row.expires_at,
        row.created_at,
        row.ip_address,
        row.user_agent,
      );
    },
    getSessionByTokenHash: (tokenHash) =>
      first<SessionRow>(
        `SELECT * FROM user_sessions WHERE token_hash = ? AND revoked_at IS NULL`,
        tokenHash,
      ).then((r) => r ?? null),
    async revokeSession(tokenHash) {
      await run(`UPDATE user_sessions SET revoked_at = ? WHERE token_hash = ?`, now(), tokenHash);
    },
    async revokeAllSessions(userId) {
      await run(
        `UPDATE user_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`,
        now(),
        userId,
      );
    },
    async createToken(kind, row) {
      await run(
        `INSERT INTO ${tokenTable(kind)} (id, user_id, token_hash, expires_at, used_at, created_at)
         VALUES (?, ?, ?, ?, NULL, ?)`,
        row.id,
        row.user_id,
        row.token_hash,
        row.expires_at,
        row.created_at,
      );
    },
    getToken: (kind, tokenHash) =>
      first<TokenRow>(
        `SELECT * FROM ${tokenTable(kind)} WHERE token_hash = ? AND used_at IS NULL`,
        tokenHash,
      ).then((r) => r ?? null),
    async useToken(kind, id) {
      await run(`UPDATE ${tokenTable(kind)} SET used_at = ? WHERE id = ?`, now(), id);
    },
    async addAudit(row) {
      await run(
        `INSERT INTO audit_logs (id, user_id, action, outcome, ip_address, user_agent, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        row.id,
        row.user_id,
        row.action,
        row.outcome,
        row.ip_address,
        row.user_agent,
        row.metadata,
        row.created_at,
      );
    },
    async listAudit(limit) {
      const rows = await db
        .prepare(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?`)
        .bind(limit)
        .all<AuditRow>();
      return rows.results;
    },
    async getSetting(key) {
      const row = await first<{ value: string }>(
        `SELECT value FROM platform_settings WHERE key = ?`,
        key,
      );
      return row?.value ?? null;
    },
    async setSetting(key, value) {
      await run(
        `INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        key,
        value,
        now(),
      );
    },
  };
}

/* -------------------------------------------------------------------------- */
/* In-memory development store                                                 */
/* -------------------------------------------------------------------------- */

interface MemoryDb {
  users: Map<string, UserRow>;
  profiles: Map<string, ProfileRow>;
  roles: Map<string, Set<RoleKey>>;
  sessions: Map<string, SessionRow>;
  tokens: Map<TokenKind, Map<string, TokenRow>>;
  audit: AuditRow[];
  settings: Map<string, string>;
}

const globalRef = globalThis as unknown as { __pteMemoryDb?: MemoryDb };

function memoryDb(): MemoryDb {
  if (!globalRef.__pteMemoryDb) {
    globalRef.__pteMemoryDb = {
      users: new Map(),
      profiles: new Map(),
      roles: new Map(),
      sessions: new Map(),
      tokens: new Map([
        ["password_reset", new Map()],
        ["email_verification", new Map()],
      ]),
      audit: [],
      settings: new Map(),
    };
  }
  return globalRef.__pteMemoryDb;
}

function createMemoryStore(): Store {
  const db = memoryDb();
  const tokens = (kind: TokenKind) => db.tokens.get(kind)!;

  return {
    kind: "memory",
    async createUser(input) {
      const id = newId("usr");
      const ts = now();
      const user: UserRow = {
        id,
        email: input.email,
        password_hash: input.passwordHash,
        email_verified: input.emailVerified ? 1 : 0,
        status: "active",
        failed_login_attempts: 0,
        locked_until: null,
        created_at: ts,
        updated_at: ts,
      };
      db.users.set(id, user);
      db.profiles.set(id, {
        user_id: id,
        first_name: input.firstName,
        last_name: input.lastName,
        country: input.country,
        timezone: input.timezone,
        marketing_emails: 0,
        product_emails: 1,
        accepted_terms_at: input.acceptedTermsAt,
        deletion_requested_at: null,
      });
      db.roles.set(id, new Set<RoleKey>([input.role]));
      return user;
    },
    async getUserByEmail(email) {
      for (const user of db.users.values()) if (user.email === email) return user;
      return null;
    },
    async getUserById(id) {
      return db.users.get(id) ?? null;
    },
    async countUsersWithRole(role) {
      let count = 0;
      for (const set of db.roles.values()) if (set.has(role)) count += 1;
      return count;
    },
    async updatePasswordHash(userId, passwordHash) {
      const user = db.users.get(userId);
      if (!user) return;
      db.users.set(userId, {
        ...user,
        password_hash: passwordHash,
        failed_login_attempts: 0,
        locked_until: null,
        updated_at: now(),
      });
    },
    async markEmailVerified(userId) {
      const user = db.users.get(userId);
      if (user) db.users.set(userId, { ...user, email_verified: 1, updated_at: now() });
    },
    async recordLoginFailure(userId, lockedUntil) {
      const user = db.users.get(userId);
      if (!user) return;
      db.users.set(userId, {
        ...user,
        failed_login_attempts: user.failed_login_attempts + 1,
        locked_until: lockedUntil,
        updated_at: now(),
      });
    },
    async clearLoginFailures(userId) {
      const user = db.users.get(userId);
      if (!user) return;
      db.users.set(userId, {
        ...user,
        failed_login_attempts: 0,
        locked_until: null,
        updated_at: now(),
      });
    },
    async getProfile(userId) {
      return db.profiles.get(userId) ?? null;
    },
    async updateProfile(userId, patch) {
      const current = db.profiles.get(userId);
      if (!current) return;
      db.profiles.set(userId, { ...current, ...patch });
    },
    async getRoles(userId) {
      return [...(db.roles.get(userId) ?? [])];
    },
    async addRole(userId, role) {
      const set = db.roles.get(userId) ?? new Set<RoleKey>();
      set.add(role);
      db.roles.set(userId, set);
    },
    async createSession(row) {
      db.sessions.set(row.token_hash, row);
    },
    async getSessionByTokenHash(tokenHash) {
      const row = db.sessions.get(tokenHash);
      return row && !row.revoked_at ? row : null;
    },
    async revokeSession(tokenHash) {
      const row = db.sessions.get(tokenHash);
      if (row) db.sessions.set(tokenHash, { ...row, revoked_at: now() });
    },
    async revokeAllSessions(userId) {
      for (const [key, row] of db.sessions)
        if (row.user_id === userId) db.sessions.set(key, { ...row, revoked_at: now() });
    },
    async createToken(kind, row) {
      tokens(kind).set(row.token_hash, row);
    },
    async getToken(kind, tokenHash) {
      const row = tokens(kind).get(tokenHash);
      return row && !row.used_at ? row : null;
    },
    async useToken(kind, id) {
      for (const [key, row] of tokens(kind))
        if (row.id === id) tokens(kind).set(key, { ...row, used_at: now() });
    },
    async addAudit(row) {
      db.audit.unshift(row);
      if (db.audit.length > 500) db.audit.length = 500;
    },
    async listAudit(limit) {
      return db.audit.slice(0, limit);
    },
    async getSetting(key) {
      return db.settings.get(key) ?? null;
    },
    async setSetting(key, value) {
      db.settings.set(key, value);
    },
  };
}

export function getStore(env: WorkerEnv): Store {
  return env.DB ? createD1Store(env.DB) : createMemoryStore();
}

import { audit, createContext, requireRole } from "./auth.server";
import { newId, randomToken, sha256Hex } from "./crypto.server";
import { assertCsrf, errorResponse, HttpError, json } from "./http.server";

const SETTING_KEYS = [
  "platform_profile",
  "availability",
  "legal_content",
  "email_templates",
  "ai_preferences",
  "operations",
  "report_branding",
] as const;

const defaults = {
  platform: {
    name: "ScorePath PTE",
    logoUrl: "",
    faviconUrl: "",
    supportEmail: "support@scorepath.example",
    contactDetails: "",
    homepageContent: "",
    currency: "AUD",
  },
  availability: {
    tests: true,
    modules: { speaking: true, writing: true, reading: true, listening: true },
    difficulties: { easy: true, intermediate: true, hard: true },
    defaultTestDuration: 30,
    registrationOpen: true,
    maintenanceMode: false,
  },
  legal: {
    terms: "",
    privacy: "",
    disclaimer: "",
    practiceScoreDisclaimer:
      "Practice scores are estimates and are not official PTE Academic results.",
  },
  emailTemplates: {
    welcome: { subject: "Welcome", body: "Welcome to {{platform_name}}." },
    passwordReset: {
      subject: "Reset your password",
      body: "Use this secure link to reset your password: {{reset_url}}",
    },
    purchase: { subject: "Purchase confirmed", body: "Your test is now available in My Tests." },
  },
  ai: {
    provider: "cloudflare",
    writingModel: "@cf/meta/llama-3.1-8b-instruct-fast",
    speakingModel: "@cf/meta/llama-3.1-8b-instruct-fast",
    transcriptionModel: "@cf/openai/whisper-large-v3-turbo",
  },
  operations: {
    audioRetentionDays: 30,
    minimumQuestionPool: { speaking: 20, writing: 20, reading: 20, listening: 20 },
  },
  reportBranding: {
    title: "ScorePath PTE Practice Report",
    logoUrl: "",
    footer: "Practice score only — not an official PTE Academic result.",
  },
};

function safeObject(value: string | null): Record<string, unknown> {
  try {
    return value ? (JSON.parse(value) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function allowed<T extends Record<string, unknown>>(template: T, candidate: unknown): T {
  const source =
    candidate && typeof candidate === "object" ? (candidate as Record<string, unknown>) : {};
  const output: Record<string, unknown> = {};
  for (const [key, fallback] of Object.entries(template)) {
    const value = source[key];
    if (fallback && typeof fallback === "object" && !Array.isArray(fallback)) {
      output[key] = allowed(fallback as Record<string, unknown>, value);
    } else if (typeof value === typeof fallback) {
      output[key] = value;
    } else {
      output[key] = fallback;
    }
  }
  return output as T;
}

async function loadSettings(
  DB: NonNullable<Awaited<ReturnType<typeof createContext>>["env"]["DB"]>,
) {
  const rows = (
    await DB.prepare(
      `SELECT key,value FROM platform_settings WHERE key IN (${SETTING_KEYS.map(() => "?").join(",")})`,
    )
      .bind(...SETTING_KEYS)
      .all<{ key: string; value: string }>()
  ).results;
  const map = new Map(rows.map((row) => [row.key, safeObject(row.value)]));
  const prices = (
    await DB.prepare(
      `SELECT p.id productId,p.name,pr.unit_amount amount,pr.currency,pr.is_active active FROM products p JOIN prices pr ON pr.product_id=p.id WHERE pr.ends_at IS NULL ORDER BY p.name`,
    ).all()
  ).results;
  return {
    platform: allowed(defaults.platform, map.get("platform_profile")),
    availability: allowed(defaults.availability, map.get("availability")),
    legal: allowed(defaults.legal, map.get("legal_content")),
    emailTemplates: allowed(defaults.emailTemplates, map.get("email_templates")),
    ai: allowed(defaults.ai, map.get("ai_preferences")),
    operations: allowed(defaults.operations, map.get("operations")),
    reportBranding: allowed(defaults.reportBranding, map.get("report_branding")),
    pricing: prices.map((row) => ({ ...row, active: Boolean((row as { active: number }).active) })),
  };
}

async function body(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "Invalid request body.");
  }
}

async function adminAudit(
  ctx: Awaited<ReturnType<typeof createContext>>,
  request: Request,
  adminId: string,
  action: string,
  metadata: Record<string, unknown>,
) {
  await audit(ctx, request, { userId: adminId, action, outcome: "success", metadata });
}

export async function handleAdminRequest(request: Request, action: string): Promise<Response> {
  try {
    const ctx = await createContext();
    const admin = await requireRole(ctx, request, "admin");
    const DB = ctx.env.DB;
    if (!DB) throw new HttpError(503, "D1 is not configured.");

    if (request.method === "POST") assertCsrf(request);

    if (action === "settings" && request.method === "GET")
      return json({ settings: await loadSettings(DB) });
    if (action === "settings" && request.method === "POST") {
      const input = await body(request);
      const before = await loadSettings(DB);
      const sections: Array<[string, unknown]> = [
        ["platform_profile", allowed(defaults.platform, input["platform"])],
        ["availability", allowed(defaults.availability, input["availability"])],
        ["legal_content", allowed(defaults.legal, input["legal"])],
        ["email_templates", allowed(defaults.emailTemplates, input["emailTemplates"])],
        ["ai_preferences", allowed(defaults.ai, input["ai"])],
        ["operations", allowed(defaults.operations, input["operations"])],
        ["report_branding", allowed(defaults.reportBranding, input["reportBranding"])],
      ];
      const now = new Date().toISOString();
      for (const [key, value] of sections) {
        if (value && typeof value === "object")
          await DB.prepare(
            `INSERT INTO platform_settings(key,value,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`,
          )
            .bind(key, JSON.stringify(value), now)
            .run();
      }
      if (Array.isArray(input["pricing"])) {
        for (const raw of input["pricing"]) {
          const price = raw as {
            productId?: string;
            amount?: number;
            currency?: string;
            active?: boolean;
          };
          if (!price.productId || !Number.isInteger(price.amount) || Number(price.amount) < 0)
            continue;
          await DB.prepare(
            `UPDATE prices SET unit_amount=?,currency=?,is_active=? WHERE product_id=? AND ends_at IS NULL`,
          )
            .bind(
              Number(price.amount),
              String(price.currency ?? "AUD")
                .toUpperCase()
                .slice(0, 3),
              price.active ? 1 : 0,
              price.productId,
            )
            .run();
        }
      }
      const after = await loadSettings(DB);
      await adminAudit(ctx, request, admin.id, "platform.settings.update", {
        entity: "platform_settings",
        entityId: "global",
        before,
        after,
        result: "saved",
      });
      return json({ settings: after });
    }

    if (action === "students") {
      const search = new URL(request.url).searchParams.get("search")?.trim() ?? "";
      const like = `%${search}%`;
      const rows = (
        await DB.prepare(
          `SELECT u.id,u.email,u.status,u.created_at createdAt,p.first_name firstName,p.last_name lastName,
        (SELECT COUNT(*) FROM purchases x WHERE x.user_id=u.id) purchases,
        (SELECT COUNT(*) FROM test_attempts a WHERE a.user_id=u.id) attempts,
        (SELECT COUNT(*) FROM test_attempts a WHERE a.user_id=u.id AND a.status='completed') completed,
        (SELECT MAX(a.created_at) FROM test_attempts a WHERE a.user_id=u.id) lastActiveAt
        FROM users u JOIN user_roles ur ON ur.user_id=u.id AND ur.role_key='student' LEFT JOIN user_profiles p ON p.user_id=u.id
        WHERE (?='' OR u.email LIKE ? OR p.first_name LIKE ? OR p.last_name LIKE ?) ORDER BY u.created_at DESC LIMIT 200`,
        )
          .bind(search, like, like, like)
          .all()
      ).results;
      return json({ students: rows });
    }

    if (action === "student-detail") {
      const id = new URL(request.url).searchParams.get("id");
      if (!id) throw new HttpError(400, "Student ID is required.");
      const profile = await DB.prepare(
        `SELECT u.id,u.email,u.status,u.email_verified emailVerified,u.created_at createdAt,p.* FROM users u LEFT JOIN user_profiles p ON p.user_id=u.id WHERE u.id=?`,
      )
        .bind(id)
        .first();
      if (!profile) throw new HttpError(404, "Student not found.");
      const [purchases, attempts, entitlements, activity] = await Promise.all([
        DB.prepare(
          `SELECT id,product_name,amount,currency,status,purchased_at FROM purchases WHERE user_id=? ORDER BY purchased_at DESC LIMIT 50`,
        )
          .bind(id)
          .all(),
        DB.prepare(
          `SELECT id,template_name,status,total_score,created_at,completed_at FROM test_attempts WHERE user_id=? ORDER BY created_at DESC LIMIT 50`,
        )
          .bind(id)
          .all(),
        DB.prepare(
          `SELECT e.id,e.status,e.template_id,t.name templateName,e.source,e.created_at createdAt FROM test_entitlements e LEFT JOIN test_templates t ON t.id=e.template_id WHERE e.user_id=? ORDER BY e.created_at DESC LIMIT 50`,
        )
          .bind(id)
          .all(),
        DB.prepare(
          `SELECT action,outcome,metadata,created_at FROM audit_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 50`,
        )
          .bind(id)
          .all(),
      ]);
      return json({
        profile,
        purchases: purchases.results,
        attempts: attempts.results,
        entitlements: entitlements.results,
        activity: activity.results,
      });
    }

    if (action === "student-action" && request.method === "POST") {
      const input = await body(request);
      const studentId = String(input["studentId"] ?? "");
      const operation = String(input["operation"] ?? "");
      const before = await DB.prepare(`SELECT id,email,status FROM users WHERE id=?`)
        .bind(studentId)
        .first<{ id: string; email: string; status: string }>();
      if (!before) throw new HttpError(404, "Student not found.");
      if (operation === "disable" || operation === "reactivate") {
        const status = operation === "disable" ? "disabled" : "active";
        await DB.prepare(`UPDATE users SET status=?,updated_at=? WHERE id=?`)
          .bind(status, new Date().toISOString(), studentId)
          .run();
        if (status === "disabled")
          await DB.prepare(
            `UPDATE user_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL`,
          )
            .bind(new Date().toISOString(), studentId)
            .run();
      } else if (operation === "password_reset") {
        const token = randomToken(32);
        await DB.prepare(
          `INSERT INTO password_reset_tokens(id,user_id,token_hash,expires_at,created_at) VALUES(?,?,?,?,?)`,
        )
          .bind(
            newId("rst"),
            studentId,
            await sha256Hex(token),
            new Date(Date.now() + 3600000).toISOString(),
            new Date().toISOString(),
          )
          .run();
      } else if (operation === "grant_entitlement") {
        const templateId = String(input["templateId"] ?? "");
        const exists = await DB.prepare(
          `SELECT id FROM test_templates WHERE id=? AND status='published'`,
        )
          .bind(templateId)
          .first();
        if (!exists) throw new HttpError(422, "Select a published test template.");
        await DB.prepare(
          `INSERT INTO test_entitlements(id,user_id,template_id,status,source,price_paid,currency,created_at) VALUES(?,?,?,'active','admin',0,'AUD',?)`,
        )
          .bind(newId("ent"), studentId, templateId, new Date().toISOString())
          .run();
      } else if (operation === "revoke_entitlement") {
        await DB.prepare(
          `UPDATE test_entitlements SET status='refunded' WHERE id=? AND user_id=? AND status='active' AND attempt_id IS NULL`,
        )
          .bind(String(input["entitlementId"] ?? ""), studentId)
          .run();
      } else if (operation === "delete_workflow") {
        await DB.prepare(
          `UPDATE user_profiles SET deletion_requested_at=?,updated_at=? WHERE user_id=?`,
        )
          .bind(new Date().toISOString(), new Date().toISOString(), studentId)
          .run();
        await DB.prepare(`UPDATE users SET status='disabled',updated_at=? WHERE id=?`)
          .bind(new Date().toISOString(), studentId)
          .run();
        await DB.prepare(
          `UPDATE user_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL`,
        )
          .bind(new Date().toISOString(), studentId)
          .run();
      } else throw new HttpError(400, "Unsupported student operation.");
      const after = await DB.prepare(`SELECT id,email,status FROM users WHERE id=?`)
        .bind(studentId)
        .first();
      await adminAudit(ctx, request, admin.id, `student.${operation}`, {
        entity: "user",
        entityId: studentId,
        before,
        after,
        result: "success",
        emailConfigured: Boolean(ctx.env.EMAIL_API_KEY),
      });
      return json({
        ok: true,
        emailQueued: operation === "password_reset" && Boolean(ctx.env.EMAIL_API_KEY),
      });
    }

    if (action === "audit-logs") {
      const rows = (
        await DB.prepare(
          `SELECT a.id,a.user_id adminId,COALESCE(u.email,'System') adminUser,a.action,a.outcome result,a.ip_address ipAddress,a.user_agent userAgent,a.metadata,a.created_at createdAt FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 300`,
        ).all()
      ).results;
      return json({
        logs: rows.map((row) => ({
          ...row,
          metadata: safeObject((row as { metadata: string | null }).metadata),
        })),
      });
    }

    if (action === "health") {
      let d1 = { status: "healthy", detail: "Query succeeded" };
      try {
        await DB.prepare("SELECT 1 ok").first();
      } catch {
        d1 = { status: "failed", detail: "Query failed" };
      }
      const recentErrors = (
        await DB.prepare(
          `SELECT id,event_type eventType,severity,message,created_at createdAt FROM platform_events WHERE severity IN ('error','critical') ORDER BY created_at DESC LIMIT 20`,
        ).all()
      ).results;
      const failedJobs = (
        await DB.prepare(
          `SELECT id,'AI evaluation' kind,status,created_at createdAt FROM ai_evaluation_jobs WHERE status='failed' UNION ALL SELECT id,'Content import' kind,status,created_at createdAt FROM import_jobs WHERE status='failed' ORDER BY createdAt DESC LIMIT 20`,
        ).all()
      ).results;
      const webhook = await DB.prepare(
        `SELECT status,received_at receivedAt,error_message errorMessage FROM webhook_events ORDER BY received_at DESC LIMIT 1`,
      ).first();
      return json({
        health: {
          d1,
          r2: { status: ctx.env.MEDIA ? "configured" : "unavailable" },
          kv: { status: ctx.env.SETTINGS_KV && ctx.env.SESSIONS_KV ? "configured" : "partial" },
          queue: { status: ctx.env.CONTENT_IMPORT_QUEUE ? "configured" : "fallback" },
          ai: {
            status: ctx.env.AI ? "configured" : "unavailable",
            provider: "Cloudflare Workers AI",
          },
          stripeWebhook: webhook
            ? { status: (webhook as { status: string }).status, ...webhook }
            : { status: ctx.env.STRIPE_WEBHOOK_SECRET ? "configured—no events" : "unavailable" },
          recentErrors,
          failedJobs,
        },
      });
    }

    if (action === "dashboard") {
      const scalar = async (sql: string) =>
        (await DB.prepare(sql).first<{ value: number }>())?.value ?? 0;
      const [
        totalStudents,
        newRegistrations,
        activeStudents,
        revenue,
        testsPurchased,
        testsCompleted,
        awaitingAi,
        failedScoring,
        lowPools,
      ] = await Promise.all([
        scalar(`SELECT COUNT(*) value FROM user_roles WHERE role_key='student'`),
        scalar(
          `SELECT COUNT(*) value FROM users u JOIN user_roles ur ON ur.user_id=u.id AND ur.role_key='student' WHERE u.created_at>=datetime('now','-30 days')`,
        ),
        scalar(
          `SELECT COUNT(DISTINCT user_id) value FROM test_attempts WHERE created_at>=datetime('now','-30 days')`,
        ),
        scalar(`SELECT COALESCE(SUM(amount),0) value FROM payments WHERE status='succeeded'`),
        scalar(
          `SELECT COUNT(*) value FROM purchases WHERE status IN ('paid','complete','completed')`,
        ),
        scalar(`SELECT COUNT(*) value FROM test_attempts WHERE status='completed'`),
        scalar(
          `SELECT COUNT(*) value FROM ai_evaluation_jobs WHERE status IN ('queued','processing','pending')`,
        ),
        scalar(`SELECT COUNT(*) value FROM ai_evaluation_jobs WHERE status='failed'`),
        scalar(
          `SELECT COUNT(*) value FROM (SELECT module_key FROM questions WHERE status='published' GROUP BY module_key HAVING COUNT(*)<20)`,
        ),
      ]);
      const recentImports = (
        await DB.prepare(
          `SELECT id,status,total_questions totalQuestions,created_at createdAt FROM import_jobs ORDER BY created_at DESC LIMIT 5`,
        ).all()
      ).results;
      const recentPayments = (
        await DB.prepare(
          `SELECT p.id,p.amount,p.currency,p.status,p.created_at createdAt,u.email FROM payments p LEFT JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 5`,
        ).all()
      ).results;
      const recentSupport = (
        await DB.prepare(
          `SELECT id,email,subject,status,created_at createdAt FROM support_enquiries ORDER BY created_at DESC LIMIT 5`,
        ).all()
      ).results;
      return json({
        dashboard: {
          totalStudents,
          newRegistrations,
          activeStudents,
          revenue,
          testsPurchased,
          testsCompleted,
          awaitingAi,
          failedScoring,
          lowPools,
          recentImports,
          recentPayments,
          recentSupport,
        },
      });
    }

    throw new HttpError(404, "Admin action not found.");
  } catch (error) {
    return errorResponse(error);
  }
}

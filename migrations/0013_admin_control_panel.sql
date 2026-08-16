PRAGMA foreign_keys = ON;

-- Prompt 12: platform administration, permissions and operational visibility.
CREATE TABLE IF NOT EXISTS admin_permissions (
  key TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_role_permissions (
  role_key TEXT NOT NULL,
  permission_key TEXT NOT NULL REFERENCES admin_permissions(key) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (role_key, permission_key)
);

CREATE TABLE IF NOT EXISTS platform_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  entity_type TEXT,
  entity_id TEXT,
  message TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  resolved_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_platform_events_recent
  ON platform_events(severity, created_at DESC);

CREATE TABLE IF NOT EXISTS support_enquiries (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_support_enquiries_status
  ON support_enquiries(status, created_at DESC);

INSERT OR IGNORE INTO admin_permissions(key, description) VALUES
  ('platform.manage', 'Manage platform settings and branding'),
  ('content.manage', 'Create, review and publish content'),
  ('students.manage', 'Manage student accounts and entitlements'),
  ('payments.manage', 'Manage payments and refunds'),
  ('analytics.view', 'View analytics and operational health'),
  ('audit.view', 'View administrative audit logs');

INSERT OR IGNORE INTO roles(key, name, description) VALUES
  ('owner', 'Owner', 'Full platform ownership role for future multi-admin support'),
  ('content_manager', 'Content manager', 'Manages question and test content'),
  ('reviewer', 'Reviewer', 'Reviews and approves content'),
  ('support_staff', 'Support staff', 'Supports students and views operational records');

INSERT OR IGNORE INTO admin_role_permissions(role_key, permission_key)
SELECT 'admin', key FROM admin_permissions;

INSERT OR IGNORE INTO admin_role_permissions(role_key, permission_key) VALUES
  ('owner', 'platform.manage'), ('owner', 'content.manage'), ('owner', 'students.manage'),
  ('owner', 'payments.manage'), ('owner', 'analytics.view'), ('owner', 'audit.view'),
  ('content_manager', 'content.manage'), ('content_manager', 'analytics.view'),
  ('reviewer', 'content.manage'), ('support_staff', 'students.manage'),
  ('support_staff', 'payments.manage'), ('support_staff', 'analytics.view');

INSERT OR IGNORE INTO platform_settings(key, value, updated_at) VALUES
  ('platform_profile', '{}', datetime('now')),
  ('availability', '{}', datetime('now')),
  ('legal_content', '{}', datetime('now')),
  ('email_templates', '{}', datetime('now')),
  ('ai_preferences', '{}', datetime('now')),
  ('operations', '{}', datetime('now')),
  ('report_branding', '{}', datetime('now'));

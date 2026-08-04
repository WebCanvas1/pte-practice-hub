-- 0002_seed.sql — role catalogue and default platform settings

INSERT OR IGNORE INTO roles (key, name, description) VALUES
  ('student', 'Student', 'Can purchase and take practice tests.'),
  ('admin',   'Administrator', 'Full access to the admin portal.');

INSERT OR IGNORE INTO platform_settings (key, value, updated_at) VALUES
  ('platform.name',        'ScorePath PTE', datetime('now')),
  ('pricing.module_test',  '1',            datetime('now')),
  ('pricing.full_mock',    '5',            datetime('now')),
  ('pricing.currency',     'AUD',          datetime('now')),
  ('auth.session_ttl_days','7',            datetime('now'));

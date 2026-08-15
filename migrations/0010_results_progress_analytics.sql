CREATE TABLE IF NOT EXISTS student_recommendations (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metrics_json TEXT NOT NULL, recommendation_json TEXT NOT NULL, provider TEXT NOT NULL,
  model TEXT, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON student_recommendations(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS student_skill_metrics (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_key TEXT NOT NULL, module_key TEXT NOT NULL, attempts INTEGER NOT NULL,
  earned REAL NOT NULL, maximum REAL NOT NULL, accuracy REAL NOT NULL,
  average_seconds REAL NOT NULL, updated_at TEXT NOT NULL, UNIQUE(user_id, skill_key)
);
CREATE INDEX IF NOT EXISTS idx_skill_metrics_user ON student_skill_metrics(user_id, accuracy);

CREATE TABLE IF NOT EXISTS progress_snapshots (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_id TEXT NOT NULL UNIQUE REFERENCES test_attempts(id) ON DELETE CASCADE,
  estimated_score REAL NOT NULL, percentage REAL NOT NULL, module_scores_json TEXT NOT NULL,
  metrics_json TEXT NOT NULL, captured_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_progress_user ON progress_snapshots(user_id, captured_at);

CREATE TABLE IF NOT EXISTS study_plans (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendation_id TEXT REFERENCES student_recommendations(id) ON DELETE SET NULL,
  plan_json TEXT NOT NULL, starts_on TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS report_versions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attempt_id TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL, report_json TEXT NOT NULL, created_at TEXT NOT NULL,
  UNIQUE(attempt_id, version)
);
CREATE INDEX IF NOT EXISTS idx_reports_owner ON report_versions(user_id, attempt_id);

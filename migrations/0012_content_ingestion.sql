PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS content_uploads (
  id TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES users(id), file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL, file_size INTEGER NOT NULL, file_hash TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE, safety_status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_content_uploads_hash ON content_uploads(file_hash);

CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL,
  total_files INTEGER NOT NULL DEFAULT 0, total_questions INTEGER NOT NULL DEFAULT 0,
  approved_questions INTEGER NOT NULL DEFAULT 0, published_questions INTEGER NOT NULL DEFAULT 0,
  provider TEXT, progress INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  completed_at TEXT, cancelled_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status,created_at DESC);

CREATE TABLE IF NOT EXISTS import_job_steps (
  id TEXT PRIMARY KEY, job_id TEXT NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL, status TEXT NOT NULL, detail TEXT, started_at TEXT, completed_at TEXT,
  UNIQUE(job_id,step_key)
);

CREATE TABLE IF NOT EXISTS imported_questions (
  id TEXT PRIMARY KEY, job_id TEXT NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  upload_id TEXT NOT NULL REFERENCES content_uploads(id), source_location TEXT, prompt TEXT NOT NULL,
  module_key TEXT, type_key TEXT, difficulty TEXT, options_json TEXT NOT NULL DEFAULT '[]',
  correct_answer TEXT, model_answer TEXT, explanation TEXT, tags_json TEXT NOT NULL DEFAULT '[]',
  scoring_config_json TEXT NOT NULL DEFAULT '{}', confidence REAL NOT NULL DEFAULT 0,
  confidence_level TEXT NOT NULL DEFAULT 'low', warnings_json TEXT NOT NULL DEFAULT '[]',
  normalized_prompt TEXT NOT NULL, review_status TEXT NOT NULL DEFAULT 'pending',
  selected INTEGER NOT NULL DEFAULT 0, published_question_id TEXT REFERENCES questions(id),
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, reviewed_by TEXT REFERENCES users(id), reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_imported_questions_job ON imported_questions(job_id,review_status);
CREATE INDEX IF NOT EXISTS idx_imported_questions_normalized ON imported_questions(normalized_prompt);

CREATE TABLE IF NOT EXISTS import_assets (
  id TEXT PRIMARY KEY, job_id TEXT NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  upload_id TEXT NOT NULL REFERENCES content_uploads(id), imported_question_id TEXT REFERENCES imported_questions(id),
  asset_type TEXT NOT NULL, r2_key TEXT NOT NULL, transcript TEXT, metadata_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS duplicate_matches (
  id TEXT PRIMARY KEY, imported_question_id TEXT NOT NULL REFERENCES imported_questions(id) ON DELETE CASCADE,
  matched_question_id TEXT, matched_imported_question_id TEXT, match_type TEXT NOT NULL,
  similarity REAL NOT NULL, detail TEXT, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_duplicate_imported ON duplicate_matches(imported_question_id,similarity DESC);

CREATE TABLE IF NOT EXISTS import_errors (
  id TEXT PRIMARY KEY, job_id TEXT NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  upload_id TEXT REFERENCES content_uploads(id), step_key TEXT NOT NULL, severity TEXT NOT NULL,
  message TEXT NOT NULL, detail TEXT, created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_approvals (
  id TEXT PRIMARY KEY, job_id TEXT NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  imported_question_id TEXT REFERENCES imported_questions(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL REFERENCES users(id), action TEXT NOT NULL, notes TEXT, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_import_approvals_job ON import_approvals(job_id,created_at DESC);

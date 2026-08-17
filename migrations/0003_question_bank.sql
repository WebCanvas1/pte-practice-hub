-- 0003_question_bank.sql — central question bank for Cloudflare D1
-- Apply with: wrangler d1 migrations apply pte_portal

PRAGMA foreign_keys = ON;

-- Taxonomy

CREATE TABLE IF NOT EXISTS modules (
  key         TEXT PRIMARY KEY,          -- speaking | reading | writing | listening
  name        TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS question_types (
  key          TEXT PRIMARY KEY,         -- e.g. read_aloud, write_essay
  module_key   TEXT NOT NULL REFERENCES modules(key) ON DELETE RESTRICT,
  name         TEXT NOT NULL,
  description  TEXT,
  capabilities TEXT NOT NULL DEFAULT '{}',   -- JSON: drives the dynamic admin form
  scoring_criteria TEXT NOT NULL DEFAULT '[]', -- JSON array of criterion keys
  estimated_seconds INTEGER NOT NULL DEFAULT 60,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_active    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_question_types_module ON question_types(module_key);

-- Questions

CREATE TABLE IF NOT EXISTS questions (
  id                  TEXT PRIMARY KEY,
  module_key          TEXT NOT NULL REFERENCES modules(key) ON DELETE RESTRICT,
  type_key            TEXT NOT NULL REFERENCES question_types(key) ON DELETE RESTRICT,
  difficulty          TEXT NOT NULL CHECK (difficulty IN ('easy','intermediate','hard')),
  title               TEXT NOT NULL,
  instructions        TEXT NOT NULL DEFAULT '',
  prompt              TEXT NOT NULL DEFAULT '',
  passage             TEXT NOT NULL DEFAULT '',   -- passage or transcript shown to the student
  correct_answer      TEXT NOT NULL DEFAULT '',
  alternative_answers TEXT NOT NULL DEFAULT '[]', -- JSON array of accepted answers
  model_answer        TEXT NOT NULL DEFAULT '',
  explanation         TEXT NOT NULL DEFAULT '',
  scoring_config      TEXT NOT NULL DEFAULT '{}', -- JSON: criteria weights, word limits, timing
  score_weight        REAL NOT NULL DEFAULT 1,
  topic               TEXT NOT NULL DEFAULT '',
  content_json        TEXT NOT NULL DEFAULT '{}', -- JSON: blanks, ordering blocks, word banks
  estimated_seconds   INTEGER NOT NULL DEFAULT 60,
  audio_asset_id      TEXT REFERENCES question_assets(id) ON DELETE SET NULL,
  image_asset_id      TEXT REFERENCES question_assets(id) ON DELETE SET NULL,
  source_reference    TEXT NOT NULL DEFAULT '',
  admin_notes         TEXT NOT NULL DEFAULT '',
  ai_confidence       REAL,
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','under_review','approved','published','archived')),
  current_version     INTEGER NOT NULL DEFAULT 1,
  created_by          TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_by         TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL,
  published_at        TEXT
);
CREATE INDEX IF NOT EXISTS idx_questions_module ON questions(module_key);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type_key);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at);

-- Version history
-- Immutable snapshots. A completed attempt stores the version number it used,
-- so editing a published question never changes an existing attempt.

CREATE TABLE IF NOT EXISTS question_versions (
  id             TEXT PRIMARY KEY,
  question_id    TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot       TEXT NOT NULL,            -- JSON snapshot of the full question payload
  status         TEXT NOT NULL,
  change_note    TEXT NOT NULL DEFAULT '',
  created_by     TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at     TEXT NOT NULL,
  UNIQUE (question_id, version_number)
);
CREATE INDEX IF NOT EXISTS idx_question_versions_question ON question_versions(question_id);

-- Options

CREATE TABLE IF NOT EXISTS question_options (
  id          TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label       TEXT NOT NULL DEFAULT '',
  content     TEXT NOT NULL,
  is_correct  INTEGER NOT NULL DEFAULT 0,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id, position);

-- Assets
-- Files themselves live in R2; this table stores the metadata and object key.

CREATE TABLE IF NOT EXISTS question_assets (
  id               TEXT PRIMARY KEY,
  question_id      TEXT REFERENCES questions(id) ON DELETE CASCADE,
  kind             TEXT NOT NULL CHECK (kind IN ('audio','image')),
  url              TEXT NOT NULL DEFAULT '',
  r2_key           TEXT,
  mime_type        TEXT,
  duration_seconds REAL,
  alt_text         TEXT,
  transcript       TEXT,
  created_by       TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_question_assets_question ON question_assets(question_id, kind);

-- Tags

CREATE TABLE IF NOT EXISTS question_tags (
  id         TEXT PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS question_tag_links (
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  tag_id      TEXT NOT NULL REFERENCES question_tags(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL,
  PRIMARY KEY (question_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_question_tag_links_tag ON question_tag_links(tag_id);

-- Reviews

CREATE TABLE IF NOT EXISTS question_reviews (
  id          TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  reviewer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,              -- submit_review | approve | publish | archive | ...
  from_status TEXT,
  to_status   TEXT,
  comment     TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_question_reviews_question ON question_reviews(question_id, created_at);

-- Usage statistics

CREATE TABLE IF NOT EXISTS question_usage_stats (
  question_id      TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  attempts         INTEGER NOT NULL DEFAULT 0,
  avg_score        REAL,
  correct_rate     REAL,
  avg_time_seconds REAL,
  last_used_at     TEXT,
  updated_at       TEXT NOT NULL
);

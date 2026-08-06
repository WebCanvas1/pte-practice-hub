-- 0005_test_system.sql — test templates, generation and attempt management
-- Apply with: wrangler d1 migrations apply pte_portal

PRAGMA foreign_keys = ON;

/* ------------------------------- templates -------------------------------- */

CREATE TABLE IF NOT EXISTS test_templates (
  id                 TEXT PRIMARY KEY,
  slug               TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  description        TEXT NOT NULL DEFAULT '',
  test_type          TEXT NOT NULL CHECK (test_type IN ('module','mock','practice_set')),
  module_key         TEXT REFERENCES modules(key) ON DELETE RESTRICT,   -- NULL for full mock tests
  difficulty         TEXT NOT NULL CHECK (difficulty IN ('easy','intermediate','hard','mixed')),
  price              REAL NOT NULL DEFAULT 1,
  currency           TEXT NOT NULL DEFAULT 'AUD',
  question_count     INTEGER NOT NULL DEFAULT 0,
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  target_score       INTEGER,
  instructions       TEXT NOT NULL DEFAULT '',
  is_active          INTEGER NOT NULL DEFAULT 1,
  purchasable        INTEGER NOT NULL DEFAULT 1,
  version            INTEGER NOT NULL DEFAULT 1,
  created_by         TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_test_templates_type ON test_templates(test_type);
CREATE INDEX IF NOT EXISTS idx_test_templates_module ON test_templates(module_key, difficulty);
CREATE INDEX IF NOT EXISTS idx_test_templates_active ON test_templates(is_active, purchasable);

-- Required question-type distribution for a template.
CREATE TABLE IF NOT EXISTS test_template_rules (
  id             TEXT PRIMARY KEY,
  template_id    TEXT NOT NULL REFERENCES test_templates(id) ON DELETE CASCADE,
  type_key       TEXT NOT NULL REFERENCES question_types(key) ON DELETE RESTRICT,
  question_count INTEGER NOT NULL DEFAULT 1,
  difficulty     TEXT CHECK (difficulty IN ('easy','intermediate','hard')), -- NULL = inherit template
  position       INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  UNIQUE (template_id, type_key, position)
);
CREATE INDEX IF NOT EXISTS idx_test_template_rules_template
  ON test_template_rules(template_id, position);

/* ------------------------------ entitlements ------------------------------ */
-- One entitlement = one right to generate one attempt from one template.
-- Payments are not implemented yet; entitlements are granted directly.

CREATE TABLE IF NOT EXISTS test_entitlements (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES test_templates(id) ON DELETE RESTRICT,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','used','expired','refunded')),
  attempt_id  TEXT,
  source      TEXT NOT NULL DEFAULT 'manual',
  price_paid  REAL NOT NULL DEFAULT 0,
  currency    TEXT NOT NULL DEFAULT 'AUD',
  created_at  TEXT NOT NULL,
  expires_at  TEXT,
  used_at     TEXT
);
CREATE INDEX IF NOT EXISTS idx_entitlements_user ON test_entitlements(user_id, status);
-- An entitlement can back at most one attempt.
CREATE UNIQUE INDEX IF NOT EXISTS idx_entitlements_attempt
  ON test_entitlements(attempt_id) WHERE attempt_id IS NOT NULL;

/* -------------------------------- attempts -------------------------------- */

CREATE TABLE IF NOT EXISTS test_attempts (
  id                 TEXT PRIMARY KEY,
  template_id        TEXT NOT NULL REFERENCES test_templates(id) ON DELETE RESTRICT,
  template_version   INTEGER NOT NULL DEFAULT 1,
  template_name      TEXT NOT NULL DEFAULT '',
  user_id            TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entitlement_id     TEXT REFERENCES test_entitlements(id) ON DELETE SET NULL,
  test_type          TEXT NOT NULL,
  module_key         TEXT,
  difficulty         TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'ready'
                       CHECK (status IN ('purchased','ready','in_progress','paused','submitted',
                                         'expired','scoring','completed','cancelled')),
  question_count     INTEGER NOT NULL DEFAULT 0,
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  current_question   INTEGER NOT NULL DEFAULT 1,
  target_score       INTEGER,
  total_score        REAL,
  created_at         TEXT NOT NULL,
  started_at         TEXT,
  paused_at          TEXT,
  submitted_at       TEXT,
  completed_at       TEXT,
  expires_at         TEXT
);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON test_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_test_attempts_template ON test_attempts(template_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_created ON test_attempts(created_at);

-- Permanent question snapshot. `snapshot` is the full question payload at the
-- version used, so editing or deleting the source question never changes an
-- existing attempt.
CREATE TABLE IF NOT EXISTS attempt_questions (
  id                TEXT PRIMARY KEY,
  attempt_id        TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  position          INTEGER NOT NULL,
  question_id       TEXT NOT NULL,
  question_version  INTEGER NOT NULL DEFAULT 1,
  module_key        TEXT NOT NULL,
  type_key          TEXT NOT NULL,
  difficulty        TEXT NOT NULL,
  title             TEXT NOT NULL DEFAULT '',
  estimated_seconds INTEGER NOT NULL DEFAULT 60,
  score_weight      REAL NOT NULL DEFAULT 1,
  snapshot          TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  UNIQUE (attempt_id, position),
  -- no duplicate questions inside the same generated test
  UNIQUE (attempt_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_attempt_questions_attempt
  ON attempt_questions(attempt_id, position);
CREATE INDEX IF NOT EXISTS idx_attempt_questions_question
  ON attempt_questions(question_id);

/* --------------------------------- answers -------------------------------- */

CREATE TABLE IF NOT EXISTS student_answers (
  id                   TEXT PRIMARY KEY,
  attempt_id           TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  attempt_question_id  TEXT NOT NULL REFERENCES attempt_questions(id) ON DELETE CASCADE,
  user_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answer_text          TEXT NOT NULL DEFAULT '',
  answer_json          TEXT NOT NULL DEFAULT '{}',   -- selections, blanks, ordering
  audio_r2_key         TEXT,                          -- spoken responses in R2
  time_spent_seconds   INTEGER NOT NULL DEFAULT 0,
  revision_count       INTEGER NOT NULL DEFAULT 0,
  is_final             INTEGER NOT NULL DEFAULT 0,
  score                REAL,
  max_score            REAL,
  score_breakdown      TEXT NOT NULL DEFAULT '{}',
  ai_feedback          TEXT NOT NULL DEFAULT '',
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL,
  UNIQUE (attempt_question_id)
);
CREATE INDEX IF NOT EXISTS idx_student_answers_attempt ON student_answers(attempt_id);

-- Append-only history of every saved change to an answer.
CREATE TABLE IF NOT EXISTS answer_revisions (
  id              TEXT PRIMARY KEY,
  answer_id       TEXT NOT NULL REFERENCES student_answers(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  answer_text     TEXT NOT NULL DEFAULT '',
  answer_json     TEXT NOT NULL DEFAULT '{}',
  created_at      TEXT NOT NULL,
  UNIQUE (answer_id, revision_number)
);
CREATE INDEX IF NOT EXISTS idx_answer_revisions_answer ON answer_revisions(answer_id);

/* --------------------------------- events --------------------------------- */
-- Timeline of everything that happens to an attempt: generated, started,
-- paused, resumed, navigation, submitted, expired, scored.

CREATE TABLE IF NOT EXISTS test_events (
  id          TEXT PRIMARY KEY,
  attempt_id  TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type  TEXT NOT NULL,
  position    INTEGER,
  metadata    TEXT NOT NULL DEFAULT '{}',
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_test_events_attempt ON test_events(attempt_id, created_at);

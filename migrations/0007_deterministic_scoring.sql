-- 0007_deterministic_scoring.sql — authoritative server-side scoring results
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS attempt_question_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attempt_id TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  attempt_question_id TEXT NOT NULL UNIQUE REFERENCES attempt_questions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  module_key TEXT NOT NULL,
  type_key TEXT NOT NULL,
  raw_score REAL NOT NULL DEFAULT 0,
  max_score REAL NOT NULL DEFAULT 0,
  score_percentage REAL,
  scoring_method TEXT NOT NULL,
  scoring_status TEXT NOT NULL CHECK (scoring_status IN ('scored','pending_ai')),
  answered INTEGER NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL,
  student_response TEXT NOT NULL DEFAULT '{}',
  correct_answer TEXT NOT NULL DEFAULT 'null',
  score_breakdown TEXT NOT NULL DEFAULT '{}',
  scored_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_attempt_question_scores_attempt ON attempt_question_scores(attempt_id);

CREATE TABLE IF NOT EXISTS attempt_scoring_results (
  attempt_id TEXT PRIMARY KEY REFERENCES test_attempts(id) ON DELETE CASCADE,
  scoring_status TEXT NOT NULL CHECK (scoring_status IN ('completed','pending_ai')),
  raw_score REAL NOT NULL DEFAULT 0,
  max_score REAL NOT NULL DEFAULT 0,
  score_percentage REAL NOT NULL DEFAULT 0,
  result_json TEXT NOT NULL,
  scored_at TEXT NOT NULL
);

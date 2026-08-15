-- Auditable AI evaluation jobs and immutable structured Writing feedback.
CREATE TABLE IF NOT EXISTS ai_evaluation_jobs (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  attempt_question_id TEXT NOT NULL REFERENCES attempt_questions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL CHECK (module_key IN ('writing', 'speaking')),
  type_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  updated_at TEXT NOT NULL,
  UNIQUE(attempt_question_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_evaluation_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_attempt ON ai_evaluation_jobs(attempt_id);

CREATE TABLE IF NOT EXISTS ai_writing_evaluations (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE REFERENCES ai_evaluation_jobs(id) ON DELETE CASCADE,
  attempt_id TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  attempt_question_id TEXT NOT NULL UNIQUE REFERENCES attempt_questions(id) ON DELETE CASCADE,
  criterion_scores_json TEXT NOT NULL,
  raw_score REAL NOT NULL,
  max_score REAL NOT NULL,
  score_percentage REAL NOT NULL,
  summary_feedback TEXT NOT NULL,
  strengths_json TEXT NOT NULL,
  improvements_json TEXT NOT NULL,
  confidence REAL NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_writing_attempt ON ai_writing_evaluations(attempt_id);

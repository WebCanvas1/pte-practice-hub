-- Transcription-backed Speaking evaluation results.
CREATE TABLE IF NOT EXISTS ai_speaking_evaluations (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE REFERENCES ai_evaluation_jobs(id) ON DELETE CASCADE,
  attempt_id TEXT NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  attempt_question_id TEXT NOT NULL UNIQUE REFERENCES attempt_questions(id) ON DELETE CASCADE,
  audio_r2_key TEXT NOT NULL,
  transcript TEXT NOT NULL,
  transcript_word_count INTEGER NOT NULL DEFAULT 0,
  transcript_vtt TEXT NOT NULL DEFAULT '',
  criterion_scores_json TEXT NOT NULL,
  raw_score REAL NOT NULL,
  max_score REAL NOT NULL,
  score_percentage REAL NOT NULL,
  summary_feedback TEXT NOT NULL,
  strengths_json TEXT NOT NULL,
  improvements_json TEXT NOT NULL,
  confidence REAL NOT NULL,
  provider TEXT NOT NULL,
  transcription_model TEXT NOT NULL,
  evaluation_model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_speaking_attempt
  ON ai_speaking_evaluations(attempt_id);

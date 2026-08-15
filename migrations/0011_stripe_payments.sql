PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, product_type TEXT NOT NULL,
  module_key TEXT, stripe_product_id TEXT, is_active INTEGER NOT NULL DEFAULT 1,
  metadata_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS prices (
  id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'AUD', unit_amount INTEGER NOT NULL CHECK(unit_amount>=0),
  stripe_price_id TEXT, is_active INTEGER NOT NULL DEFAULT 1, starts_at TEXT NOT NULL, ends_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id,is_active,starts_at);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, discount_type TEXT NOT NULL CHECK(discount_type IN ('fixed','percentage')),
  amount_off INTEGER, percent_off REAL, currency TEXT NOT NULL DEFAULT 'AUD', expires_at TEXT,
  usage_limit INTEGER, times_used INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1,
  applicable_products_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS checkout_sessions (
  id TEXT PRIMARY KEY, stripe_session_id TEXT UNIQUE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES test_templates(id) ON DELETE RESTRICT,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  price_id TEXT NOT NULL REFERENCES prices(id) ON DELETE RESTRICT, coupon_id TEXT REFERENCES coupons(id),
  subtotal INTEGER NOT NULL, discount INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL,
  currency TEXT NOT NULL, status TEXT NOT NULL, idempotency_key TEXT NOT NULL UNIQUE,
  checkout_url TEXT, failure_message TEXT, expires_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_checkout_user ON checkout_sessions(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY, checkout_session_id TEXT NOT NULL UNIQUE REFERENCES checkout_sessions(id) ON DELETE RESTRICT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, stripe_payment_intent_id TEXT UNIQUE,
  amount INTEGER NOT NULL, currency TEXT NOT NULL, status TEXT NOT NULL,
  failure_code TEXT, failure_message TEXT, paid_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_id TEXT REFERENCES payments(id), checkout_session_id TEXT NOT NULL UNIQUE REFERENCES checkout_sessions(id),
  template_id TEXT NOT NULL REFERENCES test_templates(id), product_name TEXT NOT NULL,
  amount INTEGER NOT NULL, currency TEXT NOT NULL, status TEXT NOT NULL, purchased_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id,purchased_at DESC);

CREATE TABLE IF NOT EXISTS entitlements (
  id TEXT PRIMARY KEY, purchase_id TEXT NOT NULL UNIQUE REFERENCES purchases(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES test_templates(id), test_entitlement_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL, cancelled_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_payment_entitlements_user ON entitlements(user_id,status);

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY, payment_id TEXT NOT NULL REFERENCES payments(id), stripe_refund_id TEXT UNIQUE,
  amount INTEGER NOT NULL, currency TEXT NOT NULL, status TEXT NOT NULL, reason TEXT,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY, stripe_event_id TEXT NOT NULL UNIQUE, event_type TEXT NOT NULL,
  livemode INTEGER NOT NULL DEFAULT 0, payload_json TEXT NOT NULL, status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1, error_message TEXT, received_at TEXT NOT NULL, processed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhook_events(status,received_at DESC);

INSERT OR IGNORE INTO products VALUES
('prod_speaking','speaking-test','Individual Speaking test','test','speaking',NULL,1,'{}',datetime('now'),datetime('now')),
('prod_reading','reading-test','Individual Reading test','test','reading',NULL,1,'{}',datetime('now'),datetime('now')),
('prod_writing','writing-test','Individual Writing test','test','writing',NULL,1,'{}',datetime('now'),datetime('now')),
('prod_listening','listening-test','Individual Listening test','test','listening',NULL,1,'{}',datetime('now'),datetime('now')),
('prod_mock','complete-mock','Complete mock test','test',NULL,NULL,1,'{}',datetime('now'),datetime('now')),
('prod_credits','credit-pack','Future credit pack','credit_pack',NULL,NULL,0,'{}',datetime('now'),datetime('now'));
INSERT OR IGNORE INTO prices VALUES
('price_speaking_aud','prod_speaking','AUD',100,NULL,1,datetime('now'),NULL,datetime('now')),
('price_reading_aud','prod_reading','AUD',100,NULL,1,datetime('now'),NULL,datetime('now')),
('price_writing_aud','prod_writing','AUD',100,NULL,1,datetime('now'),NULL,datetime('now')),
('price_listening_aud','prod_listening','AUD',100,NULL,1,datetime('now'),NULL,datetime('now')),
('price_mock_aud','prod_mock','AUD',500,NULL,1,datetime('now'),NULL,datetime('now'));

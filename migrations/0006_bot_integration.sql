-- Durable website-to-Telegram-bot synchronization metadata.
-- Worker also installs equivalent triggers idempotently on first authenticated integration request.
CREATE TABLE IF NOT EXISTS integration_bot_assignments (
  telegram_user_id TEXT PRIMARY KEY,
  castle TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_bot_active_castle ON integration_bot_assignments(castle) WHERE active=1;
CREATE TABLE IF NOT EXISTS integration_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL UNIQUE,
  aggregate_type TEXT NOT NULL,
  aggregate_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  delivered_at TEXT
);

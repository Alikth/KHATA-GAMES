-- KHATA GAMES war cancellation and trade system
-- war_logs cancellation columns are added idempotently by ensureWarLogSchema in worker.js.
CREATE TABLE IF NOT EXISTS trade_requests (
  id TEXT PRIMARY KEY,
  sender_account_id TEXT NOT NULL,
  sender_castle TEXT NOT NULL,
  receiver_account_id TEXT NOT NULL,
  receiver_castle TEXT NOT NULL,
  send_assets_json TEXT NOT NULL DEFAULT '{}',
  receive_assets_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  responded_at TEXT
);
-- KHATA GAMES war expedition log
CREATE TABLE IF NOT EXISTS war_logs (
  id TEXT PRIMARY KEY,
  week_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  attacker_account_id TEXT NOT NULL,
  attacker_username TEXT NOT NULL,
  lord_name TEXT,
  type TEXT NOT NULL,
  source_castle TEXT NOT NULL,
  destination_castle TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  is_fake INTEGER NOT NULL DEFAULT 0,
  assets_json TEXT NOT NULL DEFAULT '{}'
);
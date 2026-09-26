-- Security hardening: enforce one fake war expedition per account/week.
DELETE FROM war_logs
WHERE is_fake = 1
  AND id NOT IN (
    SELECT MIN(id)
    FROM war_logs
    WHERE is_fake = 1
    GROUP BY attacker_account_id, week_key
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_war_fake_week
ON war_logs(attacker_account_id, week_key)
WHERE is_fake = 1;

CREATE INDEX IF NOT EXISTS idx_trade_pending_sender
ON trade_requests(sender_account_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_trade_pending_receiver
ON trade_requests(receiver_account_id, status, created_at);

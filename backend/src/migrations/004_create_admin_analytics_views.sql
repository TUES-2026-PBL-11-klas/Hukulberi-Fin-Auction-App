CREATE OR REPLACE VIEW admin_overview AS
SELECT
  (SELECT COUNT(*)::int FROM users) AS total_users,
  (SELECT COUNT(*)::int FROM users WHERE banned = true) AS banned_users,
  (SELECT COUNT(*)::int FROM auctions) AS total_auctions,
  (SELECT COUNT(*)::int FROM auctions WHERE status = 'ACTIVE') AS active_auctions,
  (SELECT COUNT(*)::int FROM bids) AS total_bids,
  (SELECT COALESCE(SUM(amount), 0)::numeric(12,2) FROM bids) AS total_volume;

CREATE OR REPLACE VIEW admin_top_users AS
SELECT
  u.id AS user_id,
  u.username,
  COUNT(b.id)::int AS bids_count,
  COALESCE(SUM(b.amount), 0)::numeric(12,2) AS total_bid_amount
FROM users u
LEFT JOIN bids b ON b.bidder_id = u.id
GROUP BY u.id, u.username
ORDER BY bids_count DESC, total_bid_amount DESC;

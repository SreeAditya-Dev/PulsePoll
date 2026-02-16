-- Anti-abuse enhancement: add unique constraint on IP per poll
-- This prevents the same IP from voting twice even with different fingerprints
-- (e.g. different browsers, incognito mode)

-- Add unique index on (poll_id, voter_ip) - allows NULL IPs
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique_ip
  ON votes(poll_id, voter_ip)
  WHERE voter_ip IS NOT NULL AND voter_ip != 'unknown';

-- PulsePoll: votes table
-- Records individual votes with fingerprint-based uniqueness per poll

CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  voter_fingerprint VARCHAR(64) NOT NULL,
  voter_ip VARCHAR(45),
  voted_at TIMESTAMPTZ DEFAULT now()
);

-- ANTI-ABUSE mechanism #1: database-level unique constraint
-- Prevents the same browser fingerprint from voting twice on the same poll
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique_voter
  ON votes(poll_id, voter_fingerprint);

-- index for counting votes by poll
CREATE INDEX IF NOT EXISTS idx_votes_poll ON votes(poll_id);

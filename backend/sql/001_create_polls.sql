-- PulsePoll: polls table
-- Stores poll questions with share codes for shareable links

CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  share_code VARCHAR(12) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  creator_fingerprint VARCHAR(64)
);

-- fast lookup by share code (used on every poll page load)
CREATE INDEX IF NOT EXISTS idx_polls_share_code ON polls(share_code);

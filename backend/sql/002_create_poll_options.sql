-- PulsePoll: poll_options table
-- Stores the answer options for each poll

CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0
);

-- index for fetching options by poll
CREATE INDEX IF NOT EXISTS idx_poll_options_poll ON poll_options(poll_id);

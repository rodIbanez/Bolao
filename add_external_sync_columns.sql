-- Migration: Add external_id to matches table for API sync
-- This allows 100% accurate matching with football-data.org API

ALTER TABLE matches 
ADD COLUMN external_id TEXT UNIQUE;

-- Add index for faster lookups when syncing
CREATE INDEX idx_matches_external_id ON matches(external_id);

-- Add status column to track match state (SCHEDULED, IN_PLAY, PAUSED, FINISHED, etc.)
ALTER TABLE matches 
ADD COLUMN status TEXT DEFAULT 'SCHEDULED' 
CHECK (status IN ('SCHEDULED', 'TIMED', 'IN_PLAY', 'PAUSED', 'FINISHED', 'POSTPONED', 'SUSPENDED', 'CANCELLED'));

-- Add column for last sync timestamp
ALTER TABLE matches 
ADD COLUMN last_synced_at TIMESTAMPTZ;

-- Optional: Add full_time_home_score and full_time_away_score for historical tracking
-- (Some APIs distinguish between current score and final score)
ALTER TABLE matches 
ADD COLUMN full_time_home_score INT,
ADD COLUMN full_time_away_score INT;

COMMENT ON COLUMN matches.external_id IS 'External API ID from football-data.org for match synchronization';
COMMENT ON COLUMN matches.status IS 'Current match status from external API';
COMMENT ON COLUMN matches.last_synced_at IS 'Timestamp of last successful sync from external API';

-- 010: Expand competitions with company config and richer entries

-- Competitions: add company reference and configuration
ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS company_id TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS entry_deadline DATE,
  ADD COLUMN IF NOT EXISTS registration_url TEXT,
  ADD COLUMN IF NOT EXISTS scoring_system TEXT NOT NULL DEFAULT 'tiered',
  ADD COLUMN IF NOT EXISTS configured_divisions JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS configured_categories JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS configured_levels JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS configured_styles JSONB NOT NULL DEFAULT '[]';

-- Competition entries: add structured fields
ALTER TABLE competition_entries
  ADD COLUMN IF NOT EXISTS age_division TEXT,
  ADD COLUMN IF NOT EXISTS competitive_level TEXT,
  ADD COLUMN IF NOT EXISTS style TEXT,
  ADD COLUMN IF NOT EXISTS award_tier TEXT,
  ADD COLUMN IF NOT EXISTS choreographer TEXT,
  ADD COLUMN IF NOT EXISTS song_title TEXT,
  ADD COLUMN IF NOT EXISTS song_artist TEXT,
  ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS dancer_names TEXT[] DEFAULT '{}';

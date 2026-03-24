-- 006: Add transition columns to formations table
ALTER TABLE formations
  ADD COLUMN IF NOT EXISTS transition_duration_ms INTEGER NOT NULL DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS transition_easing TEXT NOT NULL DEFAULT 'ease-in-out'
    CHECK (transition_easing IN ('linear', 'ease-in', 'ease-out', 'ease-in-out'));

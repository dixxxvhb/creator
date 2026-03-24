-- 005: dancer_paths table (matches services/dancerPaths.ts expectations)
CREATE TABLE IF NOT EXISTS dancer_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  dancer_label TEXT NOT NULL,
  path_points JSONB NOT NULL DEFAULT '[]',
  path_type TEXT NOT NULL DEFAULT 'freehand' CHECK (path_type IN ('freehand', 'geometric')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (formation_id, dancer_label)
);

-- Index for fast lookups by formation
CREATE INDEX idx_dancer_paths_formation ON dancer_paths(formation_id);

-- RLS (permissive for now — TODO: tighten when auth is wired up,
-- should join through formations → pieces → user_id like 001)
ALTER TABLE dancer_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all dancer_paths" ON dancer_paths FOR ALL USING (true) WITH CHECK (true);

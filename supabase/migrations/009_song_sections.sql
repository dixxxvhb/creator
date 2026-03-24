-- 009: Song sections for piece structure
CREATE TABLE IF NOT EXISTS song_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id UUID NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  section_type TEXT NOT NULL DEFAULT 'Custom',
  start_seconds REAL NOT NULL DEFAULT 0,
  end_seconds REAL NOT NULL DEFAULT 0,
  formation_id UUID REFERENCES formations(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_song_sections_piece ON song_sections(piece_id);

-- TODO: tighten RLS when auth is wired up
ALTER TABLE song_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all song_sections" ON song_sections FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER set_song_sections_updated_at
  BEFORE UPDATE ON song_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

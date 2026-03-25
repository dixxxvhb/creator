-- Shows and Show Acts tables
-- These were created manually in the Supabase dashboard but need version-controlled migrations

CREATE TABLE IF NOT EXISTS shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date,
  venue text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  buffer_acts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS show_acts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
  piece_id uuid NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  act_number integer NOT NULL DEFAULT 0,
  intermission_before boolean NOT NULL DEFAULT false,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies (permissive for beta, tighten later)
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_acts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for shows" ON shows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for show_acts" ON show_acts FOR ALL USING (true) WITH CHECK (true);

-- Add missing user_id columns
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE costumes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Drop all existing permissive/old policies
DROP POLICY IF EXISTS "Allow all competitions" ON competitions;
DROP POLICY IF EXISTS "Allow all entries" ON competition_entries;
DROP POLICY IF EXISTS "Allow all costumes" ON costumes;
DROP POLICY IF EXISTS "Allow all costume_accessories" ON costume_accessories;
DROP POLICY IF EXISTS "Allow all costume_assignments" ON costume_assignments;
DROP POLICY IF EXISTS "Allow all piece_seasons" ON piece_seasons;
DROP POLICY IF EXISTS "Allow all props" ON props;
DROP POLICY IF EXISTS "Allow all seasons" ON seasons;
DROP POLICY IF EXISTS "Allow all song_sections" ON song_sections;
DROP POLICY IF EXISTS "Users manage own pieces" ON pieces;
DROP POLICY IF EXISTS "Users manage own dancers" ON dancers;
DROP POLICY IF EXISTS "Users manage formations of own pieces" ON formations;
DROP POLICY IF EXISTS "Users manage positions of own formations" ON dancer_positions;
DROP POLICY IF EXISTS "Users can insert own bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Users can read own bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admin can read all bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admin can update bug reports" ON bug_reports;

-- Enable RLS on all tables
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dancer_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dancers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE competition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE costumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE costume_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE costume_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE show_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE dancer_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE piece_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE piece_seasons ENABLE ROW LEVEL SECURITY;

-- Direct ownership policies
CREATE POLICY "Users can CRUD own pieces" ON pieces FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own dancers" ON dancers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own seasons" ON seasons FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own competitions" ON competitions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own shows" ON shows FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own costumes" ON costumes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bug reports: anyone can insert, only owner can read/update/delete
CREATE POLICY "Anyone can create bug reports" ON bug_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own bug reports" ON bug_reports FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own bug reports" ON bug_reports FOR UPDATE USING (auth.uid() = user_id);

-- Child table policies (inherit ownership through parent)
CREATE POLICY "Users can CRUD formations of own pieces" ON formations FOR ALL
  USING (EXISTS (SELECT 1 FROM pieces WHERE pieces.id = formations.piece_id AND pieces.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM pieces WHERE pieces.id = formations.piece_id AND pieces.user_id = auth.uid()));

CREATE POLICY "Users can CRUD positions of own pieces" ON dancer_positions FOR ALL
  USING (EXISTS (SELECT 1 FROM formations JOIN pieces ON pieces.id = formations.piece_id WHERE formations.id = dancer_positions.formation_id AND pieces.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM formations JOIN pieces ON pieces.id = formations.piece_id WHERE formations.id = dancer_positions.formation_id AND pieces.user_id = auth.uid()));

CREATE POLICY "Users can CRUD paths of own pieces" ON dancer_paths FOR ALL
  USING (EXISTS (SELECT 1 FROM formations JOIN pieces ON pieces.id = formations.piece_id WHERE formations.id = dancer_paths.formation_id AND pieces.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM formations JOIN pieces ON pieces.id = formations.piece_id WHERE formations.id = dancer_paths.formation_id AND pieces.user_id = auth.uid()));

CREATE POLICY "Users can CRUD song sections of own pieces" ON song_sections FOR ALL
  USING (EXISTS (SELECT 1 FROM pieces WHERE pieces.id = song_sections.piece_id AND pieces.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM pieces WHERE pieces.id = song_sections.piece_id AND pieces.user_id = auth.uid()));

CREATE POLICY "Users can CRUD entries of own competitions" ON competition_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM competitions WHERE competitions.id = competition_entries.competition_id AND competitions.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM competitions WHERE competitions.id = competition_entries.competition_id AND competitions.user_id = auth.uid()));

CREATE POLICY "Users can CRUD accessories of own costumes" ON costume_accessories FOR ALL
  USING (EXISTS (SELECT 1 FROM costumes WHERE costumes.id = costume_accessories.costume_id AND costumes.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM costumes WHERE costumes.id = costume_accessories.costume_id AND costumes.user_id = auth.uid()));

CREATE POLICY "Users can CRUD assignments of own costumes" ON costume_assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM costumes WHERE costumes.id = costume_assignments.costume_id AND costumes.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM costumes WHERE costumes.id = costume_assignments.costume_id AND costumes.user_id = auth.uid()));

CREATE POLICY "Users can CRUD acts of own shows" ON show_acts FOR ALL
  USING (EXISTS (SELECT 1 FROM shows WHERE shows.id = show_acts.show_id AND shows.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM shows WHERE shows.id = show_acts.show_id AND shows.user_id = auth.uid()));

-- Piece shares: owner can CRUD, anyone can SELECT by token (for viewer page)
CREATE POLICY "Users can CRUD shares of own pieces" ON piece_shares FOR ALL
  USING (EXISTS (SELECT 1 FROM pieces WHERE pieces.id = piece_shares.piece_id AND pieces.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM pieces WHERE pieces.id = piece_shares.piece_id AND pieces.user_id = auth.uid()));
CREATE POLICY "Anyone can read shares by token" ON piece_shares FOR SELECT USING (true);

-- Piece-seasons junction table
CREATE POLICY "Users can CRUD own piece-season links" ON piece_seasons FOR ALL
  USING (
    EXISTS (SELECT 1 FROM pieces WHERE pieces.id = piece_seasons.piece_id AND pieces.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM seasons WHERE seasons.id = piece_seasons.season_id AND seasons.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM pieces WHERE pieces.id = piece_seasons.piece_id AND pieces.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM seasons WHERE seasons.id = piece_seasons.season_id AND seasons.user_id = auth.uid())
  );

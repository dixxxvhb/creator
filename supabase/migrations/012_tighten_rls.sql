-- 012: Tighten RLS policies to scope data by authenticated user
-- NOTE: Apply AFTER enabling auth. Before auth, data won't be accessible.

-- Helper: get current user ID
-- (auth.uid() is built into Supabase)

-- ─── Pieces ───
DROP POLICY IF EXISTS "Allow all pieces" ON pieces;
CREATE POLICY "Users can manage own pieces" ON pieces
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Formations (via piece ownership) ───
DROP POLICY IF EXISTS "Allow all formations" ON formations;
CREATE POLICY "Users can manage own formations" ON formations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM pieces WHERE pieces.id = formations.piece_id AND pieces.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM pieces WHERE pieces.id = formations.piece_id AND pieces.user_id = auth.uid())
  );

-- ─── Dancer Positions (via formation → piece) ───
DROP POLICY IF EXISTS "Allow all dancer_positions" ON dancer_positions;
CREATE POLICY "Users can manage own positions" ON dancer_positions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM formations f
      JOIN pieces p ON p.id = f.piece_id
      WHERE f.id = dancer_positions.formation_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM formations f
      JOIN pieces p ON p.id = f.piece_id
      WHERE f.id = dancer_positions.formation_id AND p.user_id = auth.uid()
    )
  );

-- ─── Dancer Paths (via formation → piece) ───
DROP POLICY IF EXISTS "Allow all dancer_paths" ON dancer_paths;
CREATE POLICY "Users can manage own paths" ON dancer_paths
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM formations f
      JOIN pieces p ON p.id = f.piece_id
      WHERE f.id = dancer_paths.formation_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM formations f
      JOIN pieces p ON p.id = f.piece_id
      WHERE f.id = dancer_paths.formation_id AND p.user_id = auth.uid()
    )
  );

-- ─── Dancers (global roster) ───
DROP POLICY IF EXISTS "Allow all dancers" ON dancers;
CREATE POLICY "Users can manage own dancers" ON dancers
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Seasons ───
DROP POLICY IF EXISTS "Allow all seasons" ON seasons;
CREATE POLICY "Users can manage own seasons" ON seasons
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Piece-Seasons (via piece or season ownership) ───
DROP POLICY IF EXISTS "Allow all piece_seasons" ON piece_seasons;
CREATE POLICY "Users can manage own piece_seasons" ON piece_seasons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM pieces WHERE pieces.id = piece_seasons.piece_id AND pieces.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM seasons WHERE seasons.id = piece_seasons.season_id AND seasons.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM pieces WHERE pieces.id = piece_seasons.piece_id AND pieces.user_id = auth.uid())
  );

-- ─── Competitions (via season) ───
DROP POLICY IF EXISTS "Allow all competitions" ON competitions;
CREATE POLICY "Users can manage own competitions" ON competitions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM seasons WHERE seasons.id = competitions.season_id AND seasons.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM seasons WHERE seasons.id = competitions.season_id AND seasons.user_id = auth.uid())
  );

-- ─── Competition Entries (via competition → season) ───
DROP POLICY IF EXISTS "Allow all entries" ON competition_entries;
CREATE POLICY "Users can manage own entries" ON competition_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM competitions c
      JOIN seasons s ON s.id = c.season_id
      WHERE c.id = competition_entries.competition_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM competitions c
      JOIN seasons s ON s.id = c.season_id
      WHERE c.id = competition_entries.competition_id AND s.user_id = auth.uid()
    )
  );

-- ─── Costumes (via piece) ───
DROP POLICY IF EXISTS "Allow all costumes" ON costumes;
CREATE POLICY "Users can manage own costumes" ON costumes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM pieces WHERE pieces.id = costumes.piece_id AND pieces.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM pieces WHERE pieces.id = costumes.piece_id AND pieces.user_id = auth.uid())
  );

-- ─── Costume Assignments (via costume → piece) ───
DROP POLICY IF EXISTS "Allow all costume_assignments" ON costume_assignments;
CREATE POLICY "Users can manage own costume_assignments" ON costume_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM costumes c
      JOIN pieces p ON p.id = c.piece_id
      WHERE c.id = costume_assignments.costume_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM costumes c
      JOIN pieces p ON p.id = c.piece_id
      WHERE c.id = costume_assignments.costume_id AND p.user_id = auth.uid()
    )
  );

-- ─── Costume Accessories (via costume → piece) ───
DROP POLICY IF EXISTS "Allow all costume_accessories" ON costume_accessories;
CREATE POLICY "Users can manage own costume_accessories" ON costume_accessories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM costumes c
      JOIN pieces p ON p.id = c.piece_id
      WHERE c.id = costume_accessories.costume_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM costumes c
      JOIN pieces p ON p.id = c.piece_id
      WHERE c.id = costume_accessories.costume_id AND p.user_id = auth.uid()
    )
  );

-- ─── Props (via piece) ───
DROP POLICY IF EXISTS "Allow all props" ON props;
CREATE POLICY "Users can manage own props" ON props
  FOR ALL USING (
    EXISTS (SELECT 1 FROM pieces WHERE pieces.id = props.piece_id AND pieces.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM pieces WHERE pieces.id = props.piece_id AND pieces.user_id = auth.uid())
  );

-- ─── Song Sections (via piece) ───
DROP POLICY IF EXISTS "Allow all song_sections" ON song_sections;
CREATE POLICY "Users can manage own song_sections" ON song_sections
  FOR ALL USING (
    EXISTS (SELECT 1 FROM pieces WHERE pieces.id = song_sections.piece_id AND pieces.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM pieces WHERE pieces.id = song_sections.piece_id AND pieces.user_id = auth.uid())
  );

-- ─── User Purchases ───
DROP POLICY IF EXISTS "Allow all user_purchases" ON user_purchases;
CREATE POLICY "Users can manage own purchases" ON user_purchases
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Auto-set user_id on insert via triggers ───
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_pieces_user_id ON pieces;
CREATE TRIGGER set_pieces_user_id
  BEFORE INSERT ON pieces
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_dancers_user_id ON dancers;
CREATE TRIGGER set_dancers_user_id
  BEFORE INSERT ON dancers
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

DROP TRIGGER IF EXISTS set_seasons_user_id ON seasons;
CREATE TRIGGER set_seasons_user_id
  BEFORE INSERT ON seasons
  FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- Public share payload RPC.
-- Replaces the old "Anyone can read shares by token" policy with a single
-- SECURITY DEFINER function that returns ONLY the fields the public viewer needs.
-- Owner UUIDs, timestamps, and unrelated metadata are never exposed.

DROP POLICY IF EXISTS "Anyone can read shares by token" ON piece_shares;

CREATE OR REPLACE FUNCTION public.get_shared_piece_payload(share_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  share_record piece_shares%ROWTYPE;
  shared_piece pieces%ROWTYPE;
  piece_json jsonb;
  formations_json jsonb;
  positions_json jsonb;
BEGIN
  SELECT *
  INTO share_record
  FROM piece_shares
  WHERE token = share_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF share_record.expires_at IS NOT NULL AND share_record.expires_at < now() THEN
    RETURN NULL;
  END IF;

  SELECT *
  INTO shared_piece
  FROM pieces
  WHERE id = share_record.piece_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  piece_json := jsonb_build_object(
    'id',           shared_piece.id,
    'title',        shared_piece.title,
    'song_title',   shared_piece.song_title,
    'song_artist',  shared_piece.song_artist,
    'stage_width',  shared_piece.stage_width,
    'stage_depth',  shared_piece.stage_depth
  );

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id',           f.id,
        'index',        f.index,
        'label',        f.label,
        'choreo_notes', f.choreo_notes
      )
      ORDER BY f.index
    ),
    '[]'::jsonb
  )
  INTO formations_json
  FROM formations f
  WHERE f.piece_id = shared_piece.id;

  SELECT COALESCE(
    jsonb_object_agg(grouped.formation_id, grouped.positions),
    '{}'::jsonb
  )
  INTO positions_json
  FROM (
    SELECT
      dp.formation_id,
      jsonb_agg(
        jsonb_build_object(
          'id',           dp.id,
          'formation_id', dp.formation_id,
          'dancer_label', dp.dancer_label,
          'x',            dp.x,
          'y',            dp.y,
          'color',        dp.color
        )
        ORDER BY dp.created_at, dp.id
      ) AS positions
    FROM dancer_positions dp
    JOIN formations f ON f.id = dp.formation_id
    WHERE f.piece_id = shared_piece.id
    GROUP BY dp.formation_id
  ) AS grouped;

  RETURN jsonb_build_object(
    'piece',      piece_json,
    'formations', formations_json,
    'positions',  positions_json
  );
END;
$$;

ALTER FUNCTION public.get_shared_piece_payload(text) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.get_shared_piece_payload(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_piece_payload(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_piece_payload(text) TO authenticated;

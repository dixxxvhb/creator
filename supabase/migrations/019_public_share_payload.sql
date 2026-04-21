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

  SELECT COALESCE(
    jsonb_agg(to_jsonb(f) ORDER BY f.index),
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
      jsonb_agg(to_jsonb(dp) ORDER BY dp.created_at, dp.id) AS positions
    FROM dancer_positions dp
    JOIN formations f ON f.id = dp.formation_id
    WHERE f.piece_id = shared_piece.id
    GROUP BY dp.formation_id
  ) AS grouped;

  RETURN jsonb_build_object(
    'piece', to_jsonb(shared_piece),
    'formations', formations_json,
    'positions', positions_json
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_shared_piece_payload(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_piece_payload(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_piece_payload(text) TO authenticated;

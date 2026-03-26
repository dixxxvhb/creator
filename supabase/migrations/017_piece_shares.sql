CREATE TABLE IF NOT EXISTS piece_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id UUID NOT NULL REFERENCES pieces(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_piece_shares_token ON piece_shares(token);

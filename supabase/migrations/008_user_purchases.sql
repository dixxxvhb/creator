-- 008: User purchases for tier tracking
CREATE TABLE IF NOT EXISTS user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'mid', 'studio')),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  apple_transaction_id TEXT,
  receipt_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_purchases_user ON user_purchases(user_id);

-- TODO: tighten RLS when auth is wired up
ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all user_purchases" ON user_purchases FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER set_user_purchases_updated_at
  BEFORE UPDATE ON user_purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

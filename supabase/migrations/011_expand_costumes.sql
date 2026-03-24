-- 011: Expand costumes with vendor, order status, and accessories
ALTER TABLE costumes
  ADD COLUMN IF NOT EXISTS vendor_url TEXT,
  ADD COLUMN IF NOT EXISTS order_status TEXT NOT NULL DEFAULT 'not_ordered'
    CHECK (order_status IN ('not_ordered', 'ordered', 'arrived', 'needs_alteration', 'ready'));

-- Accessories table (hairpiece, tights, shoes, jewelry per costume)
CREATE TABLE IF NOT EXISTS costume_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  costume_id UUID NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
  accessory_type TEXT NOT NULL CHECK (accessory_type IN ('hairpiece', 'tights', 'shoes', 'jewelry', 'other')),
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_costume_accessories_costume ON costume_accessories(costume_id);

ALTER TABLE costume_accessories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all costume_accessories" ON costume_accessories FOR ALL USING (true) WITH CHECK (true);

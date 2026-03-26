-- 016: Add choreographer field to pieces
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS choreographer TEXT;

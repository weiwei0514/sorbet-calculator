-- ============================================================
-- Sorbet Calculator — Supabase Schema
-- Run this whole file once in the Supabase SQL Editor for a
-- fresh project. No migration framework — this is the single
-- source of truth for the schema.
-- ============================================================

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'fruit'
    CHECK (category IN ('fruit', 'other_sugar')),
  water_pct NUMERIC(5,2) NOT NULL CHECK (water_pct >= 0 AND water_pct <= 100),
  sugar_pct NUMERIC(5,2) NOT NULL CHECK (sugar_pct >= 0 AND sugar_pct <= 100),
  other_solids_pct NUMERIC(5,2) NOT NULL CHECK (other_solids_pct >= 0 AND other_solids_pct <= 100),
  total_solids_pct NUMERIC(5,2) GENERATED ALWAYS AS (sugar_pct + other_solids_pct) STORED,
  CONSTRAINT composition_sums_to_100
    CHECK (ABS(water_pct + sugar_pct + other_solids_pct - 100) <= 0.05),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients (lower(name));

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ingredients_updated_at ON ingredients;
CREATE TRIGGER trg_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS — single-user tool, no auth. Anyone holding this project's
-- anon key (i.e. this app's own frontend) may read/write. This is
-- acceptable because it is a private desktop-style tool for one
-- pastry chef, not a public multi-tenant product.
-- ============================================================
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_full_access_ingredients"
  ON ingredients FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Seed data — best-effort approximate compositions for common
-- sorbet fruits. All editable afterwards via the app's 食材資料庫 UI.
-- ============================================================
INSERT INTO ingredients (name, category, water_pct, sugar_pct, other_solids_pct) VALUES
  ('草莓',   'fruit', 87, 9,  4),
  ('桃子',   'fruit', 88, 9,  3),
  ('芒果',   'fruit', 82, 15, 3),
  ('香蕉',   'fruit', 74, 21, 5),
  ('鳳梨',   'fruit', 85, 12, 3),
  ('百香果', 'fruit', 82, 11, 7),
  ('覆盆子', 'fruit', 85, 8,  7),
  ('藍莓',   'fruit', 84, 12, 4),
  ('柚子',   'fruit', 89, 8,  3),
  ('檸檬',   'fruit', 90, 5,  5),
  ('柳橙',   'fruit', 87, 10, 3),
  ('葡萄糖粉', 'other_sugar', 19, 81, 0)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Sorbet Calculator — Supabase Schema
-- Run this whole file once in the Supabase SQL Editor for a
-- fresh project. No migration framework for the base schema —
-- this is the source of truth for a new setup. Incremental
-- changes to an already-provisioned project live in
-- supabase/migrations/ instead (run those in order afterwards
-- only if this file's history predates them).
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
  -- Reference-book suggested fruit% range for this ingredient (informational hint only,
  -- does not affect the app's hard 25–60% validation). NULL when unknown.
  recommended_min_pct NUMERIC(5,2),
  recommended_max_pct NUMERIC(5,2),
  -- POD (甜度) / PAC (抗凍力) coefficients, relative to sucrose = 1.00. Plain decimals
  -- (0.45, not 45). NULL = not yet measured/entered; treated as 0 contribution by the app,
  -- never guessed here.
  pod_coefficient NUMERIC(6,3),
  pac_coefficient NUMERIC(6,3),
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
-- Seed data. Fruit compositions and recommended ranges sourced from
-- a pastry/gelato reference book (附表1 材料成分比例參考、附表2 水果成分
-- 參考、附表3 Sorbet 中水果的建議添加值) where available; otherwise
-- best-effort approximates. All editable afterwards via 食材資料庫 UI.
-- ============================================================
INSERT INTO ingredients (name, category, water_pct, sugar_pct, other_solids_pct, recommended_min_pct, recommended_max_pct, pod_coefficient, pac_coefficient) VALUES
  ('草莓',   'fruit', 87, 9,  4,  35,   60,   NULL, NULL),
  ('桃子',   'fruit', 83, 8,  9,  50,   60,   NULL, NULL),
  ('芒果',   'fruit', 82, 15, 3,  40,   60,   NULL, NULL),
  ('香蕉',   'fruit', 77, 15, 8,  50,   60,   NULL, NULL),
  ('鳳梨',   'fruit', 79, 12, 9,  45,   60,   NULL, NULL),
  ('百香果', 'fruit', 82, 11, 7,  30,   45,   NULL, NULL),
  ('覆盆子', 'fruit', 83, 14, 3,  45,   55,   NULL, NULL),
  ('藍莓',   'fruit', 84, 12, 4,  45,   55,   NULL, NULL),
  ('柚子',   'fruit', 89, 8,  3,  NULL, NULL, NULL, NULL),
  ('檸檬',   'fruit', 90, 9,  1,  25,   35,   NULL, NULL),
  ('柳橙',   'fruit', 87, 10, 3,  NULL, NULL, NULL, NULL),
  ('橘子',   'fruit', 84, 8,  8,  55,   60,   NULL, NULL),
  ('小橘子', 'fruit', 80, 12, 8,  45,   55,   NULL, NULL),
  ('西洋梨', 'fruit', 85, 9,  6,  50,   60,   NULL, NULL),
  ('奇異果', 'fruit', 88, 9,  3,  40,   60,   NULL, NULL),
  ('葡萄柚', 'fruit', 87, 7,  6,  35,   50,   NULL, NULL),
  ('哈密瓜', 'fruit', 87, 8,  5,  40,   60,   NULL, NULL),
  ('西瓜',   'fruit', 89, 6,  5,  NULL, NULL, NULL, NULL),
  ('櫻桃',   'fruit', 84, 10, 6,  NULL, NULL, NULL, NULL),
  ('無花果', 'fruit', 85, 8,  7,  NULL, NULL, NULL, NULL),
  ('蘋果',   'fruit', 81, 13, 6,  NULL, NULL, NULL, NULL),
  ('葡萄',   'fruit', 81, 14, 5,  NULL, NULL, NULL, NULL),
  ('芭樂',   'fruit', 78, 7,  15, NULL, NULL, NULL, NULL),
  ('火龍果', 'fruit', 74, 11, 15, NULL, NULL, NULL, NULL),
  ('葡萄糖粉', 'other_sugar', 19, 81, 0, NULL, NULL, NULL, NULL),
  ('右旋糖粉', 'other_sugar', 5,  95, 0, NULL, NULL, NULL, NULL),
  ('海藻糖',   'other_sugar', 10, 90, 0, NULL, NULL, 0.45, 0.45),
  ('轉化糖',   'other_sugar', 25, 75, 0, NULL, NULL, NULL, NULL),
  ('麥芽糊精', 'other_sugar', 4,  96, 0, NULL, NULL, NULL, NULL)
ON CONFLICT DO NOTHING;

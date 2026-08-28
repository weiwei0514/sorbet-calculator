-- ============================================================
-- Run this once in the Supabase SQL Editor of your EXISTING project.
--
-- 1. Adds 油脂(fat)/無脂固形物(non-fat solids) to the ingredient
--    composition model — required fields (default 0 for existing
--    fruit/sugar rows, which genuinely have neither), matching the
--    附表1 reference table's 糖/油脂/無脂固形物/其他固形物 columns.
-- 2. Opens up 4 new ingredient categories: 巧克力/堅果醬/酒/其他.
--    These are NOT wired into the Sorbet calculator's fruit/other-
--    sugar dropdowns — just extending the shared ingredient database
--    ahead of a future Gelato mode.
-- ============================================================

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS fat_pct NUMERIC(5,2) NOT NULL DEFAULT 0
  CHECK (fat_pct >= 0 AND fat_pct <= 100);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS non_fat_solids_pct NUMERIC(5,2) NOT NULL DEFAULT 0
  CHECK (non_fat_solids_pct >= 0 AND non_fat_solids_pct <= 100);

-- total_solids_pct is a GENERATED column — its expression can't be altered in place,
-- has to be dropped and recreated.
ALTER TABLE ingredients DROP COLUMN total_solids_pct;
ALTER TABLE ingredients ADD COLUMN total_solids_pct NUMERIC(5,2)
  GENERATED ALWAYS AS (sugar_pct + fat_pct + non_fat_solids_pct + other_solids_pct) STORED;

-- composition_sums_to_100 now spans all five composition fields.
ALTER TABLE ingredients DROP CONSTRAINT composition_sums_to_100;
ALTER TABLE ingredients ADD CONSTRAINT composition_sums_to_100
  CHECK (ABS(water_pct + sugar_pct + fat_pct + non_fat_solids_pct + other_solids_pct - 100) <= 0.05);

-- Category list opens up to 6 values.
ALTER TABLE ingredients DROP CONSTRAINT ingredients_category_check;
ALTER TABLE ingredients ADD CONSTRAINT ingredients_category_check
  CHECK (category IN ('fruit', 'other_sugar', 'chocolate', 'nut_paste', 'alcohol', 'other'));

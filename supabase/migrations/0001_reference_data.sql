-- ============================================================
-- Run this once in the Supabase SQL Editor of your EXISTING project
-- (schema.sql already ran, so re-running it would duplicate rows —
-- this migration only ALTERs/UPDATEs/INSERTs what's new).
--
-- Source: user-provided reference book pages —
--   附表1 材料成分比例參考 (sugar types)
--   附表2 水果成分參考 (fruit composition)
--   附表3 Sorbet 中水果的建議添加值 (per-fruit recommended % range)
-- ============================================================

-- 1. New nullable columns for the "recommended range" hint (附表3).
--    Informational only — does not change the hard 25–60% validation.
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS recommended_min_pct NUMERIC(5,2);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS recommended_max_pct NUMERIC(5,2);

-- 2. Correct existing fruit compositions to match the reference book's
--    authoritative numbers (附表2), and attach recommended ranges (附表3)
--    to every existing fruit that has one.
UPDATE ingredients SET water_pct = 83, sugar_pct = 8,  other_solids_pct = 9,  recommended_min_pct = 50, recommended_max_pct = 60 WHERE name = '桃子';
UPDATE ingredients SET water_pct = 79, sugar_pct = 12, other_solids_pct = 9,  recommended_min_pct = 45, recommended_max_pct = 60 WHERE name = '鳳梨';
UPDATE ingredients SET water_pct = 77, sugar_pct = 15, other_solids_pct = 8,  recommended_min_pct = 50, recommended_max_pct = 60 WHERE name = '香蕉';
UPDATE ingredients SET water_pct = 83, sugar_pct = 14, other_solids_pct = 3,  recommended_min_pct = 45, recommended_max_pct = 55 WHERE name = '覆盆子';
UPDATE ingredients SET water_pct = 90, sugar_pct = 9,  other_solids_pct = 1,  recommended_min_pct = 25, recommended_max_pct = 35 WHERE name = '檸檬';
UPDATE ingredients SET recommended_min_pct = 35, recommended_max_pct = 60 WHERE name = '草莓';
UPDATE ingredients SET recommended_min_pct = 40, recommended_max_pct = 60 WHERE name = '芒果';
UPDATE ingredients SET recommended_min_pct = 30, recommended_max_pct = 45 WHERE name = '百香果';
UPDATE ingredients SET recommended_min_pct = 45, recommended_max_pct = 55 WHERE name = '藍莓';
-- 柚子、柳橙 not covered by the reference book pages — left unchanged.

-- 3. New fruits from 附表2 (+ 附表3 range where available).
INSERT INTO ingredients (name, category, water_pct, sugar_pct, other_solids_pct, recommended_min_pct, recommended_max_pct) VALUES
  ('橘子',   'fruit', 84, 8,  8,  55, 60),
  ('小橘子', 'fruit', 80, 12, 8,  45, 55),
  ('西洋梨', 'fruit', 85, 9,  6,  50, 60),
  ('奇異果', 'fruit', 88, 9,  3,  40, 60),
  ('葡萄柚', 'fruit', 87, 7,  6,  35, 50),
  ('哈密瓜', 'fruit', 87, 8,  5,  40, 60),
  ('西瓜',   'fruit', 89, 6,  5,  NULL, NULL),
  ('櫻桃',   'fruit', 84, 10, 6,  NULL, NULL),
  ('無花果', 'fruit', 85, 8,  7,  NULL, NULL),
  ('蘋果',   'fruit', 81, 13, 6,  NULL, NULL),
  ('葡萄',   'fruit', 81, 14, 5,  NULL, NULL),
  ('芭樂',   'fruit', 78, 7,  15, NULL, NULL),
  ('火龍果', 'fruit', 74, 11, 15, NULL, NULL)
ON CONFLICT DO NOTHING;

-- 4. New sugar types from 附表1.
INSERT INTO ingredients (name, category, water_pct, sugar_pct, other_solids_pct) VALUES
  ('右旋糖粉', 'other_sugar', 5,  95, 0),
  ('海藻糖',   'other_sugar', 10, 90, 0),
  ('轉化糖',   'other_sugar', 25, 75, 0),
  ('麥芽糊精', 'other_sugar', 4,  96, 0)
ON CONFLICT DO NOTHING;

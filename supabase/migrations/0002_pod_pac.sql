-- ============================================================
-- Run this once in the Supabase SQL Editor of your EXISTING project.
-- Adds POD (sweetness) / PAC (anti-freeze capacity) coefficients,
-- relative to sucrose = 1.00. Stored as plain decimals (0.45, not 45).
--
-- Only 海藻糖 gets a seeded value here — that's the one number the
-- user gave explicitly. Every other ingredient is left NULL on
-- purpose (not guessed) — fill them in via the 食材資料庫 UI using
-- your own reference system's coefficients.
-- ============================================================

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS pod_coefficient NUMERIC(6,3);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS pac_coefficient NUMERIC(6,3);

UPDATE ingredients SET pod_coefficient = 0.45, pac_coefficient = 0.45 WHERE name = '海藻糖';

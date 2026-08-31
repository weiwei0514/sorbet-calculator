-- ============================================================
-- Run this once in the Supabase SQL Editor of your EXISTING project.
-- Adds a free-text 備註 field to saved recipes, filled in on the
-- "儲存配方" form. Existing rows get an empty note.
-- ============================================================

ALTER TABLE saved_recipes
  ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';

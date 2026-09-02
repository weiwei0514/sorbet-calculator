-- ============================================================
-- Run this once in the Supabase SQL Editor of your EXISTING project.
-- Lets saved_recipes hold both Sorbet and Gelato recipes.
--   kind = 'sorbet'  → inputs: RecipeInputs,  result: RecipeResult
--   kind = 'gelato'  → inputs: GelatoInputs,  result: GelatoRecipeSnapshot
-- Existing rows are all Sorbet (the default).
-- ============================================================

ALTER TABLE saved_recipes
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'sorbet'
    CHECK (kind IN ('sorbet', 'gelato'));

CREATE INDEX IF NOT EXISTS idx_saved_recipes_kind ON saved_recipes (kind);

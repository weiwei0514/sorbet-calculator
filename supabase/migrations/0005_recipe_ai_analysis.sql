-- ============================================================
-- Run this once in the Supabase SQL Editor of your EXISTING project.
-- Adds a column to cache the AI 風味分析 result for each saved recipe.
-- A saved recipe is a frozen snapshot, so its analysis is stable — we
-- store it once and reuse it, with a "重新分析" button to overwrite.
-- Shape matches RecipeAiAnalysis in src/lib/calculator/types.ts.
-- ============================================================

ALTER TABLE saved_recipes
  ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

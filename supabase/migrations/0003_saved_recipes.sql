-- ============================================================
-- Run this once in the Supabase SQL Editor of your EXISTING project.
-- Adds a table for named, saved recipe snapshots ("儲存配方" feature).
-- inputs/result store a frozen JSON snapshot of RecipeInputs/RecipeResult
-- at save time — not just ingredient ids — so a saved recipe's numbers
-- never change even if the underlying ingredient data is edited later.
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  inputs JSONB NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_recipes_created_at ON saved_recipes (created_at DESC);

ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_full_access_saved_recipes"
  ON saved_recipes FOR ALL
  USING (true)
  WITH CHECK (true);

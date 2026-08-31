import type { RecipeAiAnalysis, RecipeInputs, RecipeResult, SavedRecipe } from '@/lib/calculator/types'

export interface SavedRecipeRow {
  id: string
  name: string
  /** Absent on projects that haven't run migration 0006 yet. */
  note?: string | null
  inputs: RecipeInputs
  result: RecipeResult
  /** Nullable, and absent entirely on projects that haven't run migration 0005 yet. */
  ai_analysis?: RecipeAiAnalysis | null
  created_at: string
}

export function rowToSavedRecipe(row: SavedRecipeRow): SavedRecipe {
  return {
    id: row.id,
    name: row.name,
    note: row.note ?? '',
    inputs: row.inputs,
    result: row.result,
    aiAnalysis: row.ai_analysis ?? null,
    createdAt: row.created_at,
  }
}

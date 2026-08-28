import type { RecipeInputs, RecipeResult, SavedRecipe } from '@/lib/calculator/types'

export interface SavedRecipeRow {
  id: string
  name: string
  inputs: RecipeInputs
  result: RecipeResult
  created_at: string
}

export function rowToSavedRecipe(row: SavedRecipeRow): SavedRecipe {
  return {
    id: row.id,
    name: row.name,
    inputs: row.inputs,
    result: row.result,
    createdAt: row.created_at,
  }
}

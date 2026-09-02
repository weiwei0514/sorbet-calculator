import type {
  RecipeAiAnalysis,
  RecipeInputs,
  RecipeResult,
  SavedRecipe,
} from '@/lib/calculator/types'
import type { GelatoInputs, GelatoRecipeSnapshot } from '@/lib/gelato/types'

export interface SavedRecipeRow {
  id: string
  name: string
  /** Absent on projects that haven't run migration 0006 yet. */
  note?: string | null
  /** Absent on projects that haven't run migration 0007 yet ⇒ treat as 'sorbet'. */
  kind?: 'sorbet' | 'gelato' | null
  // inputs/result are RecipeInputs/RecipeResult for kind 'sorbet',
  // GelatoInputs/GelatoRecipeSnapshot for kind 'gelato'.
  inputs: RecipeInputs | GelatoInputs
  result: RecipeResult | GelatoRecipeSnapshot
  /** Nullable, and absent entirely on projects that haven't run migration 0005 yet. */
  ai_analysis?: RecipeAiAnalysis | null
  created_at: string
}

export function rowToSavedRecipe(row: SavedRecipeRow): SavedRecipe {
  const base = {
    id: row.id,
    name: row.name,
    note: row.note ?? '',
    aiAnalysis: row.ai_analysis ?? null,
    createdAt: row.created_at,
  }
  if (row.kind === 'gelato') {
    return {
      ...base,
      kind: 'gelato',
      inputs: row.inputs as GelatoInputs,
      result: row.result as GelatoRecipeSnapshot,
    }
  }
  return {
    ...base,
    kind: 'sorbet',
    inputs: row.inputs as RecipeInputs,
    result: row.result as RecipeResult,
  }
}

import type { Ingredient } from '@/lib/calculator/types'

export interface IngredientRow {
  id: string
  name: string
  category: string
  water_pct: number
  sugar_pct: number
  other_solids_pct: number
  total_solids_pct: number
}

export function rowToIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    waterPct: Number(row.water_pct),
    sugarPct: Number(row.sugar_pct),
    otherSolidsPct: Number(row.other_solids_pct),
    totalSolidsPct: Number(row.total_solids_pct),
  }
}

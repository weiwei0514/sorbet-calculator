import type { Ingredient } from '@/lib/calculator/types'

export interface IngredientRow {
  id: string
  name: string
  category: string
  water_pct: number
  sugar_pct: number
  fat_pct: number
  non_fat_solids_pct: number
  other_solids_pct: number
  total_solids_pct: number
  recommended_min_pct: number | null
  recommended_max_pct: number | null
  pod_coefficient: number | null
  pac_coefficient: number | null
}

export function rowToIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    waterPct: Number(row.water_pct),
    sugarPct: Number(row.sugar_pct),
    // ?? 0 (not just Number()) — a table that hasn't run the fat_pct migration yet
    // returns `undefined` for these keys; treat that the same as the DB column default.
    fatPct: Number(row.fat_pct ?? 0),
    nonFatSolidsPct: Number(row.non_fat_solids_pct ?? 0),
    otherSolidsPct: Number(row.other_solids_pct),
    totalSolidsPct: Number(row.total_solids_pct),
    recommendedMinPct: row.recommended_min_pct == null ? null : Number(row.recommended_min_pct),
    recommendedMaxPct: row.recommended_max_pct == null ? null : Number(row.recommended_max_pct),
    // == null (not ===) on purpose: a Supabase table that hasn't run the pod_coefficient
    // migration yet returns `undefined` for these keys, not `null`.
    podCoefficient: row.pod_coefficient == null ? null : Number(row.pod_coefficient),
    pacCoefficient: row.pac_coefficient == null ? null : Number(row.pac_coefficient),
  }
}

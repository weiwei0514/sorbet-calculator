export type IngredientCategory = 'fruit' | 'other_sugar' | string

export interface Ingredient {
  id: string
  name: string
  category: IngredientCategory
  waterPct: number
  sugarPct: number
  otherSolidsPct: number
  totalSolidsPct: number
  /** Reference-book suggested fruit% range for this ingredient in a sorbet recipe.
   *  Informational only — the 25–60% hard limit in validate.ts is unaffected. Null when unknown. */
  recommendedMinPct: number | null
  recommendedMaxPct: number | null
  /** Sweetness (POD) and anti-freeze (PAC) coefficients, relative to sucrose = 1.00.
   *  Stored as plain decimals (0.45, not 45) — never divide by 100. Null when not yet measured/entered. */
  podCoefficient: number | null
  pacCoefficient: number | null
}

export type IngredientInput = Pick<
  Ingredient,
  | 'name'
  | 'category'
  | 'waterPct'
  | 'sugarPct'
  | 'otherSolidsPct'
  | 'recommendedMinPct'
  | 'recommendedMaxPct'
  | 'podCoefficient'
  | 'pacCoefficient'
>

/** Composition of any component, expressed per 100 units of its own weight. */
export interface CompositionPct {
  waterPct: number
  sugarPct: number
  otherSolidsPct: number
}

/** A fixed, non-database "synthetic" ingredient (sucrose, stabilizer/gel). */
export interface SyntheticComponentConfig extends CompositionPct {
  key: string
  label: string
  podCoefficient: number
  pacCoefficient: number
}

export interface IngredientAmount {
  ingredientId: string
  pct: number
}

export interface RecipeInputs {
  totalWeightG: number
  /** One or more fruits — the 25–60% hard limit applies to their SUM, not each row individually. */
  fruits: IngredientAmount[]
  targetTotalSolidsPct: number
  stabilizerPct: number
  /** One or more "other sugar" ingredients — the 1–5% hard limit applies to their SUM. */
  otherSugars: IngredientAmount[]
  /** Optional POD/PAC targets for the reverse-adjustment hint. Null = not set, hide the gap section. */
  targetPOD: number | null
  targetPAC: number | null
}

/** One row of the "自動計算配方" breakdown table. `key` is unique per row (e.g. multiple
 *  fruits each get their own key); `category` is what identity/color/filtering keys off. */
export interface ComponentBreakdown {
  key: string
  category: 'fruit' | 'otherSugar' | 'stabilizer' | 'sucrose' | 'water'
  label: string
  weightG: number
  waterG: number
  sugarG: number
  otherSolidsG: number
  totalSolidsG: number
  pctOfTotalWeight: number
  /** null when the underlying ingredient has no coefficient set yet (treated as 0 in totals). */
  podCoefficient: number | null
  pacCoefficient: number | null
  podContributionG: number
  pacContributionG: number
}

export interface RecipeTotals {
  weightG: number
  waterG: number
  sugarG: number
  otherSolidsG: number
  totalSolidsG: number
  waterPct: number
  sugarPct: number
  otherSolidsPct: number
  totalSolidsPct: number
  totalPOD: number
  totalPAC: number
  /** totalPOD ÷ totalWeightG × 100 — "POD 對總配方比例" in the spec. */
  podPctOfWeight: number
}

export interface TargetVsActual {
  target: number
  actual: number
  deltaPct: number
}

/** Distinct from TargetVsActual: gap = target - actual (positive = need to add more),
 *  matching the spec's own worked example ("目前13.5/目標15/差距+1.5"), not actual-target. */
export interface PodPacTarget {
  target: number
  actual: number
  gap: number
}

export interface RecipeResult {
  inputs: RecipeInputs
  components: ComponentBreakdown[]
  totals: RecipeTotals
  comparison: {
    totalSolidsPct: TargetVsActual
    fruitPct: TargetVsActual
    otherSugarPct: TargetVsActual
    stabilizerPct: TargetVsActual
  }
  podTarget: PodPacTarget | null
  pacTarget: PodPacTarget | null
  /** Names of ingredients used in this recipe that are missing a POD or PAC coefficient —
   *  their contribution is counted as 0, so totals may be incomplete. Surfaced as a UI notice. */
  missingCoefficientIngredientNames: string[]
  /** Reserved for future 抗凍力/甜度/MSNF/酸度 metrics beyond POD/PAC. Always present, empty in v1. */
  extraMetrics: Record<string, number>
}

export interface ValidationError {
  field: string
  code: string
  message: string
}

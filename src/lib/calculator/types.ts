export type IngredientCategory = 'fruit' | 'other_sugar' | string

export interface Ingredient {
  id: string
  name: string
  category: IngredientCategory
  waterPct: number
  sugarPct: number
  otherSolidsPct: number
  totalSolidsPct: number
}

export type IngredientInput = Pick<
  Ingredient,
  'name' | 'category' | 'waterPct' | 'sugarPct' | 'otherSolidsPct'
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
}

export interface RecipeInputs {
  totalWeightG: number
  fruitIngredientId: string
  fruitPct: number
  targetTotalSolidsPct: number
  stabilizerPct: number
  otherSugarIngredientId: string
  otherSugarPct: number
}

/** One row of the "自動計算配方" breakdown table. */
export interface ComponentBreakdown {
  key: string
  label: string
  weightG: number
  waterG: number
  sugarG: number
  otherSolidsG: number
  totalSolidsG: number
  pctOfTotalWeight: number
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
}

export interface TargetVsActual {
  target: number
  actual: number
  deltaPct: number
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
  /** Reserved for future POD/PAC/抗凍力/甜度/MSNF/酸度 metrics. Always present, empty in v1. */
  extraMetrics: Record<string, number>
}

export interface ValidationError {
  field: string
  code: string
  message: string
}

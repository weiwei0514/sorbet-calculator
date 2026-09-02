import type { Ingredient } from '@/lib/calculator/types'

/** A fixed acceptance band for a finished-mix metric. STEP 0 — never edited. */
export interface MetricRange {
  min: number
  max: number
}

/** How a STEP 2 material's amount is entered. */
export type MaterialUnit = 'g' | 'pct'

/** One STEP 2 material (flavour or other fixed) — a fixed weight the solver never
 *  touches, always counted inside the 100% total. */
export interface GelatoMaterial {
  ingredientId: string
  amount: number
  unit: MaterialUnit
}

export interface GelatoInputs {
  /** STEP 1 */
  totalWeightG: number
  fatTargetPct: number
  msnfTargetPct: number
  sucrosePct: number
  stabilizerPct: number
  eggYolkPct: number
  /** Which database ingredient plays each STEP 1 fixed role. '' for egg yolk = none. */
  sucroseId: string
  stabilizerId: string
  eggYolkId: string
  /** STEP 2A / STEP 2B — behave identically in the engine, split only for the UI. */
  flavourMaterials: GelatoMaterial[]
  fixedMaterials: GelatoMaterial[]
  /** STEP 2C — the three unknowns of the linear solve. */
  baseX: string
  baseY: string
  baseZ: string
}

export type GelatoComponentRole = 'step1' | 'flavour' | 'fixed' | 'base'

/** One line of the STEP 3 final formula table + composition bar + contribution table. */
export interface GelatoComponent {
  ingredientId: string
  name: string
  role: GelatoComponentRole
  weightG: number
  pctOfTotal: number
  /** Grams of sugar this component brings in. */
  sugarG: number
  /** null when the ingredient has no coefficient set (counted as 0 in the totals). */
  podCoefficient: number | null
  pacCoefficient: number | null
  /** sugarG × (coefficient ?? 0) */
  podContributionG: number
  pacContributionG: number
}

/** The STEP 3 水份／固形物 breakdown — same shape as the Sorbet analysis table. */
export interface GelatoBreakdown {
  waterG: number
  waterPct: number
  sugarG: number
  sugarPct: number
  otherSolidsG: number
  otherSolidsPct: number
  totalSolidsG: number
  totalSolidsPct: number
}

export interface GelatoRecipeSnapshot {
  components: GelatoComponent[]
  totalWeightG: number
  breakdown: GelatoBreakdown
  /** Whole-batch POD/PAC and the batch-size-independent per-1000g values. */
  podTotal: number
  pacTotal: number
  podPer1000g: number
  pacPer1000g: number
  /** The solved base weights, for display. */
  base: { xG: number; yG: number; zG: number }
  /** Intermediate values (STEP 2-2 .. 2-4) surfaced for transparency. */
  remaining: { weightG: number; fatG: number; msnfG: number }
}

export type GelatoResult =
  | { ok: true; recipe: GelatoRecipeSnapshot }
  | { ok: false; reason: 'error'; message: string; detail?: string }

export type IngredientsById = Map<string, Ingredient>

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

/** One line of the STEP 3 final formula table. */
export interface GelatoComponent {
  ingredientId: string
  name: string
  role: GelatoComponentRole
  weightG: number
  pctOfTotal: number
}

/** One line of the STEP 3 analysis block. */
export interface GelatoMetric {
  key: string
  label: string
  /** Percent of the finished mix (or a raw POD/PAC gram total when unit === '' ). */
  value: number
  unit: '%' | ''
}

/** One row of the STEP 0 GELATO FORMULA CHECK. */
export interface Step0Check {
  key: string
  label: string
  actual: number
  range: MetricRange
  pass: boolean
  /** 0 when pass; otherwise how far outside the band (absolute %). */
  overBy: number
}

export interface GelatoRecipeSnapshot {
  components: GelatoComponent[]
  totalWeightG: number
  metrics: GelatoMetric[]
  step0: Step0Check[]
  overallPass: boolean
  podTotal: number
  pacTotal: number
  /** The solved base-dairy weights, for display. */
  base: { xG: number; yG: number; zG: number }
  /** Intermediate values (STEP 2-2 .. 2-4) surfaced for transparency. */
  remaining: { weightG: number; fatG: number; msnfG: number }
}

export type GelatoResult =
  | { ok: true; recipe: GelatoRecipeSnapshot }
  | { ok: false; reason: 'error'; message: string; detail?: string }

export type IngredientsById = Map<string, Ingredient>

import type { Ingredient } from '@/lib/calculator/types'

/** An allowed band [min, max] for a finished-mix metric. */
export interface MetricRange {
  min: number
  max: number
}

/** The keys of the constrained finished-mix metrics, in display order.
 *  `custom` is a user-nameable placeholder — v1 stores its label/band but does
 *  not compute or validate a value. New metrics (乳糖, 凝固點, cost…) are added
 *  here + in metricsFromTotals + optionally in the solver objective. */
export type GelatoMetricKey =
  | 'sugar'
  | 'fat'
  | 'msnf'
  | 'otherSolids'
  | 'custom'
  | 'totalSolids'
  | 'perceivedSugar'
  | 'pac'

/** Step 0 — the allowed ranges every finished recipe must satisfy. */
export interface GelatoTargetRanges {
  sugar: MetricRange
  fat: MetricRange
  msnf: MetricRange
  otherSolids: MetricRange
  totalSolids: MetricRange
  /** 有感糖 — 蔗糖當量 %  = Σ(糖重 × POD係數) ÷ 總重 × 100 */
  perceivedSugar: MetricRange
  /** null = not constrained (the metric is still shown, just never marked ✗). */
  pac: MetricRange | null
  /** v1: label + band are persisted and displayed; no value is computed. */
  custom: { label: string; min: number; max: number }
}

/** Step 1 — a material whose weight the solver may choose within [minPct, maxPct]
 *  of the total weight. `use: false` pins it to 0. */
export interface Step1Material {
  ingredientId: string
  use: boolean
  minPct: number
  maxPct: number
}

/** Step 2 — a material the user adds at a fixed weight the solver never touches. */
export interface FreeMaterial {
  ingredientId: string
  weightG: number
}

/** The three unknowns of the linear solve: X = 脫脂奶粉, Y = 奶油, Z = 全脂牛奶. */
export interface BaseDairySelection {
  skimPowderId: string
  butterId: string
  wholeMilkId: string
}

export interface GelatoInputs {
  totalWeightG: number
  ranges: GelatoTargetRanges
  step1: Step1Material[]
  free: FreeMaterial[]
  baseDairy: BaseDairySelection
}

export type GelatoComponentRole = 'step1' | 'free' | 'base'

/** One line of the Final Recipe table. */
export interface GelatoComponent {
  ingredientId: string
  name: string
  role: GelatoComponentRole
  weightG: number
  pctOfTotal: number
}

/** One line of the Analysis panel. `range: null` ⇒ shown but never ✗.
 *  `value: null` ⇒ not computed in v1 (the custom row). */
export interface GelatoMetric {
  key: GelatoMetricKey
  label: string
  value: number | null
  range: MetricRange | null
  inRange: boolean
}

export interface GelatoRecipeSnapshot {
  components: GelatoComponent[]
  totalWeightG: number
  metrics: GelatoMetric[]
  /** Raw aggregates for display (per whole batch). */
  podTotal: number
  pacTotal: number
  waterPct: number
}

export interface GelatoViolation {
  key: GelatoMetricKey
  label: string
  achieved: number
  range: MetricRange
  direction: '偏高' | '偏低'
}

export type GelatoResult =
  | { ok: true; recipe: GelatoRecipeSnapshot }
  | { ok: false; reason: 'infeasible'; violations: GelatoViolation[]; closest: GelatoRecipeSnapshot; hint: string }
  | { ok: false; reason: 'error'; message: string }

/** Convenience alias for the resolved-ingredient lookup passed into the engine. */
export type IngredientsById = Map<string, Ingredient>

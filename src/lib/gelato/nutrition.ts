import type { Ingredient } from '@/lib/calculator/types'
import type { GelatoMetric, GelatoMetricKey, GelatoTargetRanges, MetricRange } from './types'

export interface WeightedIngredient {
  ingredient: Ingredient
  weightG: number
}

/** Absolute grams of each component across a set of weighted ingredients.
 *  podG/pacG use the Sorbet convention: 糖重(g) × 係數 (係數 null ⇒ 0). */
export interface Totals {
  weightG: number
  fatG: number
  msnfG: number
  sugarG: number
  otherSolidsG: number
  waterG: number
  totalSolidsG: number
  podG: number
  pacG: number
}

export const ZERO_TOTALS: Totals = {
  weightG: 0,
  fatG: 0,
  msnfG: 0,
  sugarG: 0,
  otherSolidsG: 0,
  waterG: 0,
  totalSolidsG: 0,
  podG: 0,
  pacG: 0,
}

export function accumulate(entries: WeightedIngredient[]): Totals {
  return entries.reduce<Totals>((acc, { ingredient, weightG }) => {
    const fatG = weightG * (ingredient.fatPct / 100)
    const msnfG = weightG * (ingredient.nonFatSolidsPct / 100)
    const sugarG = weightG * (ingredient.sugarPct / 100)
    const otherSolidsG = weightG * (ingredient.otherSolidsPct / 100)
    const waterG = weightG * (ingredient.waterPct / 100)
    return {
      weightG: acc.weightG + weightG,
      fatG: acc.fatG + fatG,
      msnfG: acc.msnfG + msnfG,
      sugarG: acc.sugarG + sugarG,
      otherSolidsG: acc.otherSolidsG + otherSolidsG,
      waterG: acc.waterG + waterG,
      // Solids = sugar + fat + MSNF + other solids (same as the Sorbet engine).
      totalSolidsG: acc.totalSolidsG + sugarG + fatG + msnfG + otherSolidsG,
      podG: acc.podG + sugarG * (ingredient.podCoefficient ?? 0),
      pacG: acc.pacG + sugarG * (ingredient.pacCoefficient ?? 0),
    }
  }, { ...ZERO_TOTALS })
}

export function addTotals(a: Totals, b: Totals): Totals {
  return {
    weightG: a.weightG + b.weightG,
    fatG: a.fatG + b.fatG,
    msnfG: a.msnfG + b.msnfG,
    sugarG: a.sugarG + b.sugarG,
    otherSolidsG: a.otherSolidsG + b.otherSolidsG,
    waterG: a.waterG + b.waterG,
    totalSolidsG: a.totalSolidsG + b.totalSolidsG,
    podG: a.podG + b.podG,
    pacG: a.pacG + b.pacG,
  }
}

const METRIC_LABELS: Record<GelatoMetricKey, string> = {
  sugar: 'Sugar 糖',
  fat: 'Fat 脂肪',
  msnf: 'MSNF 無脂乳固形物',
  otherSolids: 'Other Solids 其他固形物',
  custom: '自訂指標',
  totalSolids: 'Total Solids 總固形物',
  perceivedSugar: '有感糖（蔗糖當量）',
  pac: 'PAC',
}

function inRange(value: number, range: MetricRange | null): boolean {
  if (!range) return true
  return value >= range.min - 1e-6 && value <= range.max + 1e-6
}

/** Turns finished-mix totals into the ordered Analysis rows. W = totalWeightG. */
export function metricsFromTotals(totals: Totals, totalWeightG: number, ranges: GelatoTargetRanges): GelatoMetric[] {
  const W = totalWeightG > 0 ? totalWeightG : 1
  const pct = (g: number) => (g / W) * 100

  const row = (key: GelatoMetricKey, value: number, range: MetricRange | null, label?: string): GelatoMetric => ({
    key,
    label: label ?? METRIC_LABELS[key],
    value,
    range,
    inRange: inRange(value, range),
  })

  return [
    row('sugar', pct(totals.sugarG), ranges.sugar),
    row('fat', pct(totals.fatG), ranges.fat),
    row('msnf', pct(totals.msnfG), ranges.msnf),
    row('otherSolids', pct(totals.otherSolidsG), ranges.otherSolids),
    // custom — v1: label + band persisted, value not computed, never ✗.
    { key: 'custom', label: ranges.custom.label || '自訂指標', value: null, range: null, inRange: true },
    row('totalSolids', pct(totals.totalSolidsG), ranges.totalSolids),
    row('perceivedSugar', pct(totals.podG), ranges.perceivedSugar),
    row('pac', pct(totals.pacG), ranges.pac),
  ]
}

/** The subset of metrics the solver / validator actually enforces in v1. */
export const ENFORCED_METRIC_KEYS: GelatoMetricKey[] = [
  'sugar',
  'fat',
  'msnf',
  'otherSolids',
  'totalSolids',
  'perceivedSugar',
  'pac',
]

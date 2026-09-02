import type { Ingredient } from '@/lib/calculator/types'
import type { BaseDairySelection, GelatoTargetRanges, Step1Material } from './types'

/** Spec §2 numbers. All editable in the UI. */
export const DEFAULT_GELATO_RANGES: GelatoTargetRanges = {
  sugar: { min: 16, max: 22 },
  fat: { min: 4, max: 18 },
  msnf: { min: 8, max: 12 },
  otherSolids: { min: 0, max: 5 },
  totalSolids: { min: 32, max: 42 },
  perceivedSugar: { min: 12, max: 63 },
  pac: null,
  custom: { label: '自訂指標', min: 16, max: 22 },
}

/** Name → default [min%, max%] for the Step 1 rows we pre-populate when the
 *  matching ingredient exists in the database. Order matters (display order). */
const DEFAULT_STEP1_SPEC: { name: string; use: boolean; minPct: number; maxPct: number }[] = [
  { name: '蔗糖', use: true, minPct: 12, maxPct: 20 },
  { name: '右旋糖粉', use: false, minPct: 0, maxPct: 4 },
  { name: '穩定劑', use: true, minPct: 0.3, maxPct: 0.5 },
  { name: '蛋黃', use: false, minPct: 0, maxPct: 8 },
]

function findByName(ingredients: Ingredient[], name: string): Ingredient | undefined {
  return ingredients.find((i) => i.name === name)
}

/** Pre-populates Step 1 with whichever of the conventional materials exist in the
 *  database. Returns [] when none are found — the user adds rows manually. */
export function defaultStep1(ingredients: Ingredient[]): Step1Material[] {
  return DEFAULT_STEP1_SPEC.flatMap((spec) => {
    const match = findByName(ingredients, spec.name)
    return match
      ? [{ ingredientId: match.id, use: spec.use, minPct: spec.minPct, maxPct: spec.maxPct }]
      : []
  })
}

/** Name-matches the three base dairies; falls back to '' (an unset dropdown). */
export function defaultBaseDairy(ingredients: Ingredient[]): BaseDairySelection {
  return {
    skimPowderId: findByName(ingredients, '脫脂奶粉')?.id ?? '',
    butterId: findByName(ingredients, '奶油')?.id ?? '',
    wholeMilkId: findByName(ingredients, '全脂牛奶')?.id ?? '',
  }
}

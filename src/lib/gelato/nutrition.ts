import type { Ingredient } from '@/lib/calculator/types'

export interface WeightedIngredient {
  ingredient: Ingredient
  weightG: number
}

/** Absolute grams of each component. podG/pacG follow the Sorbet convention:
 *  糖重(g) × 係數 (係數 null ⇒ 0). No per-sugar-type split in v1. */
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
      totalSolidsG: acc.totalSolidsG + sugarG + fatG + msnfG + otherSolidsG,
      podG: acc.podG + sugarG * (ingredient.podCoefficient ?? 0),
      pacG: acc.pacG + sugarG * (ingredient.pacCoefficient ?? 0),
    }
  }, { ...ZERO_TOTALS })
}

import type { Ingredient } from '@/lib/calculator/types'

export interface BaseDairyAmounts {
  /** X = 脫脂奶粉 */
  skimPowderG: number
  /** Y = 奶油 */
  butterG: number
  /** Z = 全脂牛奶 */
  wholeMilkG: number
}

export type BaseDairySolve = { ok: true; amounts: BaseDairyAmounts } | { ok: false; degenerate: true }

interface Rhs {
  remainingG: number
  /** fatTargetG − FixedFat  (grams of fat the base dairy must supply) */
  fatFromDairyG: number
  /** msnfTargetG − FixedMSNF */
  msnfFromDairyG: number
}

/**
 * Solves, by Cramer's rule, the 3×3 system for the three base dairies:
 *
 *   [ 1      1      1     ] [X]   [ remainingG      ]
 *   [ fatS   fatB   fatM  ] [Y] = [ fatFromDairyG   ]
 *   [ msnfS  msnfB  msnfM ] [Z]   [ msnfFromDairyG  ]
 *
 * where the fat / MSNF coefficients are each ingredient's fraction (fat_pct / 100).
 * `|det| < 1e-9` ⇒ the trio's fat/MSNF profiles are (near-)linearly dependent.
 */
export function solveBaseDairy(skim: Ingredient, butter: Ingredient, wholeMilk: Ingredient, rhs: Rhs): BaseDairySolve {
  const a = [
    [1, 1, 1],
    [skim.fatPct / 100, butter.fatPct / 100, wholeMilk.fatPct / 100],
    [skim.nonFatSolidsPct / 100, butter.nonFatSolidsPct / 100, wholeMilk.nonFatSolidsPct / 100],
  ]
  const b = [rhs.remainingG, rhs.fatFromDairyG, rhs.msnfFromDairyG]

  const det3 = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])

  const det = det3(a)
  if (Math.abs(det) < 1e-9) return { ok: false, degenerate: true }

  const withColumn = (col: number) => a.map((row, r) => row.map((v, c) => (c === col ? b[r] : v)))

  return {
    ok: true,
    amounts: {
      skimPowderG: det3(withColumn(0)) / det,
      butterG: det3(withColumn(1)) / det,
      wholeMilkG: det3(withColumn(2)) / det,
    },
  }
}

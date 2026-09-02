import type { Ingredient } from '@/lib/calculator/types'

export interface BaseTriple {
  xG: number
  yG: number
  zG: number
}

export type BaseSolve =
  | { ok: true; amounts: BaseTriple }
  | { ok: false; reason: 'no_unique_solution' }

interface Rhs {
  /** STEP 2-3: Total Weight − Σ(all fixed weights) */
  remainingWeightG: number
  /** STEP 2-4: Fat target − Σ(fixed Fat) */
  remainingFatG: number
  /** STEP 2-4: MSNF target − Σ(fixed MSNF) */
  remainingMsnfG: number
}

/**
 * STEP 2-5 — the three-variable linear system, solved exactly by Cramer's rule:
 *
 *   X + Y + Z                       = remainingWeightG
 *   fatX·X + fatY·Y + fatZ·Z        = remainingFatG
 *   msnfX·X + msnfY·Y + msnfZ·Z     = remainingMsnfG
 *
 * The fat / MSNF coefficients are each base ingredient's fraction (fat_pct / 100).
 * `|det| < 1e-9` ⇒ the three ingredients' fat/MSNF profiles are linearly
 * dependent, so there is no unique solution.
 */
export function solveBase(x: Ingredient, y: Ingredient, z: Ingredient, rhs: Rhs): BaseSolve {
  const a = [
    [1, 1, 1],
    [x.fatPct / 100, y.fatPct / 100, z.fatPct / 100],
    [x.nonFatSolidsPct / 100, y.nonFatSolidsPct / 100, z.nonFatSolidsPct / 100],
  ]
  const b = [rhs.remainingWeightG, rhs.remainingFatG, rhs.remainingMsnfG]

  const det3 = (m: number[][]) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])

  const det = det3(a)
  if (Math.abs(det) < 1e-9) return { ok: false, reason: 'no_unique_solution' }

  const withColumn = (col: number) => a.map((row, r) => row.map((v, c) => (c === col ? b[r] : v)))

  return {
    ok: true,
    amounts: {
      xG: det3(withColumn(0)) / det,
      yG: det3(withColumn(1)) / det,
      zG: det3(withColumn(2)) / det,
    },
  }
}

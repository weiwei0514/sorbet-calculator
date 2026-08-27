import { describe, expect, it } from 'vitest'
import { calculateRecipe } from '../engine'
import type { Ingredient, RecipeInputs } from '../types'

const strawberry: Ingredient = {
  id: 'strawberry',
  name: '草莓',
  category: 'fruit',
  waterPct: 87,
  sugarPct: 9,
  otherSolidsPct: 4,
  totalSolidsPct: 13,
  recommendedMinPct: 35,
  recommendedMaxPct: 60,
  podCoefficient: null,
  pacCoefficient: null,
}

const glucosePowder: Ingredient = {
  id: 'glucose-powder',
  name: '葡萄糖粉',
  category: 'other_sugar',
  waterPct: 19,
  sugarPct: 81,
  otherSolidsPct: 0,
  totalSolidsPct: 81,
  recommendedMinPct: null,
  recommendedMaxPct: null,
  podCoefficient: null,
  pacCoefficient: null,
}

// Matches the spec's own worked example exactly: 100% sugar, POD=PAC=0.45.
const trehalose: Ingredient = {
  id: 'trehalose',
  name: '海藻糖',
  category: 'other_sugar',
  waterPct: 0,
  sugarPct: 100,
  otherSolidsPct: 0,
  totalSolidsPct: 100,
  recommendedMinPct: null,
  recommendedMaxPct: null,
  podCoefficient: 0.45,
  pacCoefficient: 0.45,
}

const baseInputs: RecipeInputs = {
  totalWeightG: 1000,
  fruitIngredientId: strawberry.id,
  fruitPct: 40,
  targetTotalSolidsPct: 30,
  stabilizerPct: 0.5,
  otherSugarIngredientId: glucosePowder.id,
  otherSugarPct: 3,
  targetPOD: null,
  targetPAC: null,
}

function run(inputs: Partial<RecipeInputs> = {}, fruit = strawberry, otherSugar = glucosePowder) {
  return calculateRecipe({ inputs: { ...baseInputs, ...inputs }, fruit, otherSugar })
}

describe('calculateRecipe — spec worked example', () => {
  it('matches the spec\'s hand-derived numbers exactly', () => {
    const outcome = run()
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const byKey = Object.fromEntries(outcome.result.components.map((c) => [c.key, c]))

    expect(byKey.fruit.weightG).toBeCloseTo(400, 6)
    expect(byKey.fruit.waterG).toBeCloseTo(348, 6)
    expect(byKey.fruit.sugarG).toBeCloseTo(36, 6)
    expect(byKey.fruit.otherSolidsG).toBeCloseTo(16, 6)
    expect(byKey.fruit.totalSolidsG).toBeCloseTo(52, 6)

    expect(byKey.otherSugar.weightG).toBeCloseTo(30, 6)
    expect(byKey.otherSugar.waterG).toBeCloseTo(5.7, 6)
    expect(byKey.otherSugar.sugarG).toBeCloseTo(24.3, 6)

    expect(byKey.stabilizer.weightG).toBeCloseTo(5, 6)
    expect(byKey.stabilizer.otherSolidsG).toBeCloseTo(5, 6)

    expect(byKey.sucrose.weightG).toBeCloseTo(218.7, 6)
    expect(byKey.water.weightG).toBeCloseTo(346.3, 6)

    expect(outcome.result.totals.weightG).toBeCloseTo(1000, 6)
    expect(outcome.result.totals.waterG).toBeCloseTo(700, 6)
    expect(outcome.result.totals.sugarG).toBeCloseTo(279, 6)
    expect(outcome.result.totals.otherSolidsG).toBeCloseTo(21, 6)
    expect(outcome.result.totals.totalSolidsG).toBeCloseTo(300, 6)
    expect(outcome.result.totals.totalSolidsPct).toBeCloseTo(30, 6)
  })

  it('flags infeasible solids target instead of returning a negative sucrose amount', () => {
    const outcome = run({ fruitPct: 60, targetTotalSolidsPct: 26 }, {
      ...strawberry,
      waterPct: 60,
      sugarPct: 30,
      otherSolidsPct: 10,
      totalSolidsPct: 40,
    })
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.errors.some((e) => e.code === 'INFEASIBLE_SOLIDS')).toBe(true)
    expect(outcome.errors.some((e) => e.message.includes('目前設定無法達成 26% 固形物'))).toBe(true)
  })

  it('flags infeasible water instead of returning a negative water amount', () => {
    const outcome = run({ fruitPct: 60, otherSugarPct: 5, stabilizerPct: 40, targetTotalSolidsPct: 34 })
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.errors.some((e) => e.code === 'INFEASIBLE_WATER')).toBe(true)
  })

  it('returns all range violations at once instead of failing fast', () => {
    const outcome = run({ fruitPct: 10, targetTotalSolidsPct: 50 })
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.errors.some((e) => e.field === 'fruitPct')).toBe(true)
    expect(outcome.errors.some((e) => e.field === 'targetTotalSolidsPct')).toBe(true)
  })

  it('rejects an ingredient whose composition does not sum to 100%', () => {
    const badFruit: Ingredient = { ...strawberry, waterPct: 50, sugarPct: 40, otherSolidsPct: 5, totalSolidsPct: 45 }
    const outcome = run({}, badFruit)
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.errors.some((e) => e.code === 'COMPOSITION_NOT_100')).toBe(true)
  })
})

describe('calculateRecipe — POD/PAC', () => {
  it('sucrose contributes POD/PAC at its 1.00 baseline, coefficient never divided by 100', () => {
    const outcome = run()
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const sucrose = outcome.result.components.find((c) => c.key === 'sucrose')!
    // sucrose weight is 218.7g at 100% sugar, coefficient 1.00 -> contribution should be 218.7, not 2.187 or 21870.
    expect(sucrose.podContributionG).toBeCloseTo(218.7, 6)
    expect(sucrose.pacContributionG).toBeCloseTo(218.7, 6)
  })

  it('海藻糖 100g at POD/PAC 0.45 contributes exactly 45, matching the spec example', () => {
    // 2000g total, 5% other-sugar -> exactly 100g of trehalose.
    const outcome = run({ totalWeightG: 2000, otherSugarPct: 5 }, strawberry, trehalose)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const otherSugar = outcome.result.components.find((c) => c.key === 'otherSugar')!
    expect(otherSugar.weightG).toBeCloseTo(100, 6)
    expect(otherSugar.podContributionG).toBeCloseTo(45, 6)
    expect(otherSugar.pacContributionG).toBeCloseTo(45, 6)
  })

  it('gap = target - actual, positive when actual is below target (per spec: 目前13.5/目標15/差距+1.5)', () => {
    const outcome = run({ targetPOD: 220, targetPAC: 220 })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    expect(outcome.result.podTarget).not.toBeNull()
    const gap = outcome.result.podTarget!.gap
    expect(gap).toBeCloseTo(220 - outcome.result.totals.totalPOD, 6)
  })

  it('returns null targets when not set, and lists ingredients missing coefficients without throwing', () => {
    const outcome = run()
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    expect(outcome.result.podTarget).toBeNull()
    expect(outcome.result.pacTarget).toBeNull()
    expect(outcome.result.missingCoefficientIngredientNames).toContain('草莓')
    expect(outcome.result.missingCoefficientIngredientNames).toContain('葡萄糖粉')
  })
})

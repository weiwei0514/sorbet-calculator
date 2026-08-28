import { describe, expect, it } from 'vitest'
import { calculateRecipe, type WeightedIngredient } from '../engine'
import type { Ingredient, IngredientAmount, RecipeInputs } from '../types'

const strawberry: Ingredient = {
  id: 'strawberry',
  name: '草莓',
  category: 'fruit',
  waterPct: 87,
  sugarPct: 9,
  fatPct: 0,
  nonFatSolidsPct: 0,
  otherSolidsPct: 4,
  totalSolidsPct: 13,
  recommendedMinPct: 35,
  recommendedMaxPct: 60,
  podCoefficient: null,
  pacCoefficient: null,
}

const mango: Ingredient = {
  id: 'mango',
  name: '芒果',
  category: 'fruit',
  waterPct: 82,
  sugarPct: 15,
  fatPct: 0,
  nonFatSolidsPct: 0,
  otherSolidsPct: 3,
  totalSolidsPct: 18,
  recommendedMinPct: 40,
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
  fatPct: 0,
  nonFatSolidsPct: 0,
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
  fatPct: 0,
  nonFatSolidsPct: 0,
  otherSolidsPct: 0,
  totalSolidsPct: 100,
  recommendedMinPct: null,
  recommendedMaxPct: null,
  podCoefficient: 0.45,
  pacCoefficient: 0.45,
}

const POOL = [strawberry, mango, glucosePowder, trehalose]

function toWeighted(rows: IngredientAmount[], pool: Ingredient[] = POOL): WeightedIngredient[] {
  return rows.flatMap((r) => {
    const ingredient = pool.find((i) => i.id === r.ingredientId)
    return ingredient ? [{ ingredient, pct: r.pct }] : []
  })
}

const baseInputs: RecipeInputs = {
  totalWeightG: 1000,
  fruits: [{ ingredientId: strawberry.id, pct: 40 }],
  targetTotalSolidsPct: 30,
  stabilizerPct: 0.5,
  otherSugars: [{ ingredientId: glucosePowder.id, pct: 3 }],
  targetPOD: null,
  targetPAC: null,
}

function run(inputsOverride: Partial<RecipeInputs> = {}) {
  const inputs: RecipeInputs = { ...baseInputs, ...inputsOverride }
  return calculateRecipe({ inputs, fruits: toWeighted(inputs.fruits), otherSugars: toWeighted(inputs.otherSugars) })
}

describe('calculateRecipe — spec worked example', () => {
  it('matches the spec\'s hand-derived numbers exactly', () => {
    const outcome = run()
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const byKey = Object.fromEntries(outcome.result.components.map((c) => [c.key, c]))

    expect(byKey['fruit-strawberry'].weightG).toBeCloseTo(400, 6)
    expect(byKey['fruit-strawberry'].waterG).toBeCloseTo(348, 6)
    expect(byKey['fruit-strawberry'].sugarG).toBeCloseTo(36, 6)
    expect(byKey['fruit-strawberry'].otherSolidsG).toBeCloseTo(16, 6)
    expect(byKey['fruit-strawberry'].totalSolidsG).toBeCloseTo(52, 6)

    expect(byKey['otherSugar-glucose-powder'].weightG).toBeCloseTo(30, 6)
    expect(byKey['otherSugar-glucose-powder'].waterG).toBeCloseTo(5.7, 6)
    expect(byKey['otherSugar-glucose-powder'].sugarG).toBeCloseTo(24.3, 6)

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
    // Note: this fruit has the same id as `strawberry` but different (much higher) solids,
    // so it must be passed directly as the resolved ingredient rather than via the `run()`
    // helper's POOL lookup (which would resolve back to the real, low-solids strawberry).
    const highSolidsFruit: Ingredient = { ...strawberry, waterPct: 60, sugarPct: 30, otherSolidsPct: 10, totalSolidsPct: 40 }
    const outcome = calculateRecipe({
      inputs: { ...baseInputs, fruits: [{ ingredientId: highSolidsFruit.id, pct: 60 }], targetTotalSolidsPct: 26 },
      fruits: [{ ingredient: highSolidsFruit, pct: 60 }],
      otherSugars: toWeighted(baseInputs.otherSugars),
    })
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.errors.some((e) => e.code === 'INFEASIBLE_SOLIDS')).toBe(true)
    expect(outcome.errors.some((e) => e.message.includes('目前設定無法達成 26% 固形物'))).toBe(true)
  })

  it('flags infeasible water instead of returning a negative water amount', () => {
    const outcome = run({
      fruits: [{ ingredientId: strawberry.id, pct: 60 }],
      otherSugars: [{ ingredientId: glucosePowder.id, pct: 5 }],
      stabilizerPct: 40,
      targetTotalSolidsPct: 34,
    })
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.errors.some((e) => e.code === 'INFEASIBLE_WATER')).toBe(true)
  })

  it('returns all range violations at once instead of failing fast', () => {
    const outcome = run({ fruits: [{ ingredientId: strawberry.id, pct: 5 }], targetTotalSolidsPct: 50 })
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.errors.some((e) => e.field === 'fruits')).toBe(true)
    expect(outcome.errors.some((e) => e.field === 'targetTotalSolidsPct')).toBe(true)
  })

  it('rejects an ingredient whose composition does not sum to 100%', () => {
    const badFruit: Ingredient = { ...strawberry, waterPct: 50, sugarPct: 40, otherSolidsPct: 5, totalSolidsPct: 45 }
    const outcome = calculateRecipe({
      inputs: { ...baseInputs, fruits: [{ ingredientId: badFruit.id, pct: 40 }] },
      fruits: [{ ingredient: badFruit, pct: 40 }],
      otherSugars: toWeighted(baseInputs.otherSugars),
    })
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.errors.some((e) => e.code === 'COMPOSITION_NOT_100')).toBe(true)
  })
})

describe('calculateRecipe — fat / non-fat-solids', () => {
  it('folds fat and non-fat-solids into totalSolidsG and reduces sucrose accordingly', () => {
    // A synthetic dairy-ish ingredient: 60% water, 10% sugar, 20% fat, 10% non-fat-solids, 0% other.
    const creamyFruit: Ingredient = {
      ...strawberry,
      waterPct: 60,
      sugarPct: 10,
      fatPct: 20,
      nonFatSolidsPct: 10,
      otherSolidsPct: 0,
      totalSolidsPct: 40,
    }
    const outcome = calculateRecipe({
      inputs: { ...baseInputs, fruits: [{ ingredientId: creamyFruit.id, pct: 40 }] },
      fruits: [{ ingredient: creamyFruit, pct: 40 }],
      otherSugars: toWeighted(baseInputs.otherSugars),
    })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const fruitComp = outcome.result.components.find((c) => c.key === 'fruit-strawberry')!
    // 400g at 10% sugar + 20% fat + 10% non-fat-solids -> 40 + 80 + 40 = 160g total solids,
    // not just the 40g sugar would give if fat/non-fat-solids were dropped.
    expect(fruitComp.totalSolidsG).toBeCloseTo(160, 6)

    // That larger solids contribution must reduce the auto-computed sucrose vs. the plain
    // strawberry case (52g solids at 40%) — proving totalSolidsG actually feeds the balance.
    const sucrose = outcome.result.components.find((c) => c.key === 'sucrose')!
    const plainOutcome = run()
    expect(plainOutcome.ok).toBe(true)
    if (!plainOutcome.ok) return
    const plainSucrose = plainOutcome.result.components.find((c) => c.key === 'sucrose')!
    expect(sucrose.weightG).toBeLessThan(plainSucrose.weightG)
  })

  it('is a no-op when fatPct/nonFatSolidsPct are 0 (every current fruit/other_sugar fixture)', () => {
    const outcome = run()
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    // Matches the untouched worked-example numbers exactly.
    expect(outcome.result.components.find((c) => c.key === 'sucrose')!.weightG).toBeCloseTo(218.7, 6)
    expect(outcome.result.totals.totalSolidsPct).toBeCloseTo(30, 6)
  })
})

describe('calculateRecipe — multiple fruits / multiple other sugars', () => {
  it('allows a single fruit below 10% as long as the SUM is within 10-70%', () => {
    // 25% + 20% = 45% total, but each row individually can be under the sum-only range.
    const outcome = run({
      fruits: [
        { ingredientId: strawberry.id, pct: 25 },
        { ingredientId: mango.id, pct: 20 },
      ],
    })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    expect(outcome.result.comparison.fruitPct.target).toBeCloseTo(45, 6)
    expect(outcome.result.comparison.fruitPct.actual).toBeCloseTo(45, 6)
  })

  it('sums POD/PAC contributions across multiple other-sugar rows', () => {
    const outcome = run({
      otherSugars: [
        { ingredientId: glucosePowder.id, pct: 2 },
        { ingredientId: trehalose.id, pct: 2 },
      ],
    })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const trehaloseComp = outcome.result.components.find((c) => c.key === 'otherSugar-trehalose')!
    // 1000g * 2% = 20g trehalose, 100% sugar, POD/PAC 0.45 -> 20 * 1.0 * 0.45 = 9
    expect(trehaloseComp.podContributionG).toBeCloseTo(9, 6)
    expect(trehaloseComp.pacContributionG).toBeCloseTo(9, 6)
  })

  it('rejects an empty fruit list without throwing', () => {
    const outcome = run({ fruits: [] })
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.errors.some((e) => e.field === 'fruits' && e.code === 'REQUIRED')).toBe(true)
  })

  it('rejects a fruit total outside 10-70% even when split across multiple rows', () => {
    const outcome = run({
      fruits: [
        { ingredientId: strawberry.id, pct: 3 },
        { ingredientId: mango.id, pct: 3 },
      ],
    })
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.errors.some((e) => e.field === 'fruits' && e.message.includes('總和'))).toBe(true)
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
    const outcome = run({ totalWeightG: 2000, otherSugars: [{ ingredientId: trehalose.id, pct: 5 }] })
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return

    const otherSugar = outcome.result.components.find((c) => c.key === 'otherSugar-trehalose')!
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

  it('podPer1000g/pacPer1000g stay constant when the batch is scaled at the same proportions, even though totals scale', () => {
    const at1000g = run({ totalWeightG: 1000, otherSugars: [{ ingredientId: trehalose.id, pct: 3 }] })
    const at3000g = run({ totalWeightG: 3000, otherSugars: [{ ingredientId: trehalose.id, pct: 3 }] })
    expect(at1000g.ok).toBe(true)
    expect(at3000g.ok).toBe(true)
    if (!at1000g.ok || !at3000g.ok) return

    // Totals scale 3x with the batch...
    expect(at3000g.result.totals.totalPOD).toBeCloseTo(at1000g.result.totals.totalPOD * 3, 6)
    expect(at3000g.result.totals.totalPAC).toBeCloseTo(at1000g.result.totals.totalPAC * 3, 6)

    // ...but the per-1000g "strength" value does not.
    expect(at3000g.result.totals.podPer1000g).toBeCloseTo(at1000g.result.totals.podPer1000g, 6)
    expect(at3000g.result.totals.pacPer1000g).toBeCloseTo(at1000g.result.totals.pacPer1000g, 6)

    // At exactly 1000g, per-1000g equals the total (spec's own worked example: 1000g -> POD 235.8 both ways).
    expect(at1000g.result.totals.podPer1000g).toBeCloseTo(at1000g.result.totals.totalPOD, 6)
    expect(at1000g.result.totals.pacPer1000g).toBeCloseTo(at1000g.result.totals.totalPAC, 6)
  })
})

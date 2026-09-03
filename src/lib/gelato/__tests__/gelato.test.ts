import { describe, expect, it } from 'vitest'
import type { Ingredient } from '@/lib/calculator/types'
import { calculateGelato } from '../engine'
import { defaultGelatoInputs } from '../defaults'
import type { GelatoInputs, IngredientsById } from '../types'

function ing(p: Partial<Ingredient> & { id: string; name: string }): Ingredient {
  return {
    category: 'other', waterPct: 0, sugarPct: 0, fatPct: 0, nonFatSolidsPct: 0, otherSolidsPct: 0,
    totalSolidsPct: 0, recommendedMinPct: null, recommendedMaxPct: null, podCoefficient: null, pacCoefficient: null, ...p,
  }
}

// Real-ish numbers.
const wholeMilk = ing({ id: 'milk', name: '全脂牛奶', waterPct: 87.5, fatPct: 3.5, nonFatSolidsPct: 9, otherSolidsPct: 0, podCoefficient: 0.015, pacCoefficient: 0.045 })
const cream = ing({ id: 'cream', name: '動物性鮮奶油35%', waterPct: 59.2, fatPct: 35, nonFatSolidsPct: 0, otherSolidsPct: 5.8, podCoefficient: 0.012, pacCoefficient: 0.03 })
const skimPowder = ing({ id: 'smp', name: '脫脂奶粉', waterPct: 2, fatPct: 1, nonFatSolidsPct: 97, otherSolidsPct: 0, podCoefficient: 0.084, pacCoefficient: 0.523 })
const sucrose = ing({ id: 'suc', name: '蔗糖', waterPct: 0, sugarPct: 100, podCoefficient: 1, pacCoefficient: 1 })
const stabilizer = ing({ id: 'stab', name: '穩定劑', waterPct: 0, otherSolidsPct: 100 })
const eggYolk = ing({ id: 'yolk', name: '蛋黃', waterPct: 50, fatPct: 30, nonFatSolidsPct: 0, otherSolidsPct: 20 })
const pistachio = ing({ id: 'pist', name: '開心果醬', waterPct: 0, fatPct: 50, nonFatSolidsPct: 5, otherSolidsPct: 40, sugarPct: 5 })

const BASE_LIST = [wholeMilk, cream, skimPowder, sucrose, stabilizer, eggYolk, pistachio]
const BY_ID: IngredientsById = new Map(BASE_LIST.map((i) => [i.id, i]))

function inputs(over: Partial<GelatoInputs> = {}): GelatoInputs {
  return {
    ...defaultGelatoInputs(BASE_LIST),
    totalWeightG: 1000,
    fatTargetPct: 8,
    msnfTargetPct: 10,
    sucrosePct: 16,
    stabilizerPct: 0.5,
    eggYolkPct: 0,
    ...over,
  }
}

/** Recompute a component fraction from the final recipe + ingredient data. */
function recomputePct(
  components: { ingredientId: string; weightG: number }[],
  key: 'fatPct' | 'nonFatSolidsPct' | 'sugarPct',
  W: number
): number {
  let g = 0
  for (const c of components) {
    const ing = BY_ID.get(c.ingredientId)!
    g += c.weightG * (ing[key] / 100)
  }
  return (g / W) * 100
}

describe('calculateGelato — deterministic pipeline', () => {
  it('solves the 3×3, recombines, and hits the Fat / MSNF targets exactly', () => {
    const r = calculateGelato(inputs(), BY_ID)
    expect(r.ok).toBe(true)
    if (!r.ok) return

    const total = r.recipe.components.reduce((a, c) => a + c.weightG, 0)
    expect(total).toBeCloseTo(1000, 3)

    // Fat/MSNF aren't shown any more, but the full recombination must still land on them.
    expect(recomputePct(r.recipe.components, 'fatPct', 1000)).toBeCloseTo(8, 6)
    expect(recomputePct(r.recipe.components, 'nonFatSolidsPct', 1000)).toBeCloseTo(10, 6)
  })

  it('exposes the 水份／固形物 breakdown', () => {
    const r = calculateGelato(inputs(), BY_ID)
    if (!r.ok) throw new Error('expected ok')
    const b = r.recipe.breakdown
    expect(b.sugarPct).toBeCloseTo(recomputePct(r.recipe.components, 'sugarPct', 1000), 6)
    // Total solids folds in fat + MSNF even though they aren't broken out as rows.
    expect(b.totalSolidsPct).toBeGreaterThan(b.sugarPct + b.otherSolidsPct)
    expect(r.recipe.podPer1000g).toBeCloseTo(r.recipe.podTotal, 6) // W = 1000
    expect(r.recipe.pacPer1000g).toBeCloseTo(r.recipe.pacTotal, 6)
  })

  it('subtracts flavour-material components before the 3×3', () => {
    // 100 g pistachio = 50 g fat, 5 g MSNF fixed. Fat target 80 g ⇒ dairy supplies 30 g.
    const r = calculateGelato(inputs({ flavourMaterials: [{ ingredientId: 'pist', amount: 100, unit: 'g' }] }), BY_ID)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.recipe.remaining.fatG).toBeCloseTo(80 - 50, 6)
    expect(r.recipe.remaining.msnfG).toBeCloseTo(100 - 5, 6)
    expect(r.recipe.components.some((c) => c.name === '開心果醬' && c.role === 'flavour')).toBe(true)
    // Final fat still exactly the target.
    expect(recomputePct(r.recipe.components, 'fatPct', 1000)).toBeCloseTo(8, 6)
  })

  it('honours percentage-unit flavour materials', () => {
    const g = calculateGelato(inputs({ flavourMaterials: [{ ingredientId: 'pist', amount: 100, unit: 'g' }] }), BY_ID)
    const p = calculateGelato(inputs({ flavourMaterials: [{ ingredientId: 'pist', amount: 10, unit: 'pct' }] }), BY_ID)
    if (!g.ok || !p.ok) throw new Error('expected ok')
    const gPist = g.recipe.components.find((c) => c.name === '開心果醬')!.weightG
    const pPist = p.recipe.components.find((c) => c.name === '開心果醬')!.weightG
    expect(gPist).toBeCloseTo(100, 6)
    expect(pPist).toBeCloseTo(100, 6)
  })

  it('computes milk / skim-powder / cream POD·PAC from a fixed weight fraction, not sugar %', () => {
    const r = calculateGelato(inputs(), BY_ID)
    if (!r.ok) throw new Error('expected ok')
    const milk = r.recipe.components.find((c) => c.name === '全脂牛奶')!
    const smp = r.recipe.components.find((c) => c.name === '脫脂奶粉')!
    const cr = r.recipe.components.find((c) => c.name === '動物性鮮奶油35%')!

    // sugar % is 0 for all three, but the fixed-fraction basis is not.
    expect(milk.podPacBasisG).toBeCloseTo(milk.weightG * 0.048, 6)
    expect(smp.podPacBasisG).toBeCloseTo(smp.weightG * 0.97, 6)
    expect(cr.podPacBasisG).toBeCloseTo(cr.weightG * 0.028, 6)

    expect(milk.podContributionG).toBeCloseTo(milk.weightG * 0.048 * milk.podCoefficient!, 6)
    expect(smp.pacContributionG).toBeCloseTo(smp.weightG * 0.97 * smp.pacCoefficient!, 6)

    // A non-dairy still uses sugar grams.
    const sucrose = r.recipe.components.find((c) => c.name === '蔗糖')!
    expect(sucrose.podPacBasisG).toBeCloseTo(sucrose.sugarG, 6)
  })

  it('does not treat 牛奶巧克力 as a dairy base (name ends with 巧克力)', () => {
    const milkChoc = ing({ id: 'mc', name: '牛奶巧克力', waterPct: 1, sugarPct: 50, fatPct: 35, nonFatSolidsPct: 5, otherSolidsPct: 9, podCoefficient: 0.5, pacCoefficient: 0.5 })
    const byId: IngredientsById = new Map([...BASE_LIST, milkChoc].map((i) => [i.id, i]))
    const r = calculateGelato(inputs({ flavourMaterials: [{ ingredientId: 'mc', amount: 60, unit: 'g' }] }), byId)
    if (!r.ok) throw new Error('expected ok')
    const mc = r.recipe.components.find((c) => c.name === '牛奶巧克力')!
    expect(mc.podPacBasisG).toBeCloseTo(mc.sugarG, 6) // 60 g × 50% = 30 g sugar basis
  })

  it('re-solves after adding an egg yolk fraction', () => {
    const r = calculateGelato(inputs({ eggYolkPct: 5, eggYolkId: 'yolk' }), BY_ID)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.recipe.components.some((c) => c.name === '蛋黃')).toBe(true)
    // yolk adds 50 g @ 30% fat = 15 g fat fixed ⇒ dairy supplies 80 − 15 = 65 g
    expect(r.recipe.remaining.fatG).toBeCloseTo(80 - 15, 6)
  })
})

describe('calculateGelato — failure modes', () => {
  it('❌ 無法產生合理配方 when a base weight goes negative', () => {
    // MSNF target 12% but tons of skim-powder-free fixed material forces Z negative:
    // huge cream fixed load adds fat, leaving no room / negative for the others.
    const r = calculateGelato(
      inputs({ msnfTargetPct: 12, fatTargetPct: 4, fixedMaterials: [{ ingredientId: 'cream', amount: 500, unit: 'g' }] }),
      BY_ID
    )
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.message).toContain('無法產生合理配方')
    expect(r.detail).toBeTruthy()
  })

  it('❌ 無唯一解 when the base trio is linearly dependent', () => {
    const a = ing({ id: 'a', name: 'A', waterPct: 88, fatPct: 3, nonFatSolidsPct: 9 })
    const b = ing({ id: 'b', name: 'B', waterPct: 82, fatPct: 6, nonFatSolidsPct: 12 })
    const c = ing({ id: 'c', name: 'C', waterPct: 85, fatPct: 4.5, nonFatSolidsPct: 10.5 }) // (A+B)/2
    const byId: IngredientsById = new Map([a, b, c, sucrose, stabilizer].map((i) => [i.id, i]))
    const r = calculateGelato(inputs({ baseX: 'a', baseY: 'b', baseZ: 'c' }), byId)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.message).toContain('無唯一解')
  })

  it('errors when the sucrose ingredient is not chosen', () => {
    const r = calculateGelato(inputs({ sucroseId: '' }), BY_ID)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.message).toContain('蔗糖')
  })

  it('errors when fixed materials fill the whole batch', () => {
    const r = calculateGelato(inputs({ sucrosePct: 60, fixedMaterials: [{ ingredientId: 'pist', amount: 500, unit: 'g' }] }), BY_ID)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.message).toContain('沒有空間')
  })
})

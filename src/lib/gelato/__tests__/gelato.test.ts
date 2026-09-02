import { describe, expect, it } from 'vitest'
import type { Ingredient } from '@/lib/calculator/types'
import { calculateGelato } from '../engine'
import { DEFAULT_GELATO_RANGES } from '../defaults'
import type { GelatoInputs, IngredientsById } from '../types'

function ing(partial: Partial<Ingredient> & { id: string; name: string }): Ingredient {
  return {
    category: 'other',
    waterPct: 0,
    sugarPct: 0,
    fatPct: 0,
    nonFatSolidsPct: 0,
    otherSolidsPct: 0,
    totalSolidsPct: 0,
    recommendedMinPct: null,
    recommendedMaxPct: null,
    podCoefficient: null,
    pacCoefficient: null,
    ...partial,
  }
}

// Real numbers from the user's database.
const skimPowder = ing({ id: 'skim', name: '脫脂奶粉', waterPct: 2, fatPct: 1, nonFatSolidsPct: 97, otherSolidsPct: 0, podCoefficient: 0.084, pacCoefficient: 0.523 })
const butter = ing({ id: 'butter', name: '奶油', waterPct: 16.1, fatPct: 82, nonFatSolidsPct: 0, otherSolidsPct: 1.9 })
const wholeMilk = ing({ id: 'milk', name: '全脂牛奶', waterPct: 87.5, fatPct: 3.5, nonFatSolidsPct: 9, otherSolidsPct: 0, podCoefficient: 0.015, pacCoefficient: 0.045 })
const sucrose = ing({ id: 'sucrose', name: '蔗糖', waterPct: 0, sugarPct: 100, podCoefficient: 1, pacCoefficient: 1 })
const stabilizer = ing({ id: 'stab', name: '穩定劑', waterPct: 0, otherSolidsPct: 100 })
const pistachioPaste = ing({ id: 'pist', name: '開心果醬', waterPct: 0, fatPct: 50, otherSolidsPct: 50 })

const BY_ID: IngredientsById = new Map(
  [skimPowder, butter, wholeMilk, sucrose, stabilizer, pistachioPaste].map((i) => [i.id, i])
)

function baseInputs(overrides: Partial<GelatoInputs> = {}): GelatoInputs {
  return {
    totalWeightG: 1000,
    ranges: structuredClone(DEFAULT_GELATO_RANGES),
    step1: [
      { ingredientId: 'sucrose', use: true, minPct: 14, maxPct: 20 },
      { ingredientId: 'stab', use: true, minPct: 0.3, maxPct: 0.5 },
    ],
    free: [],
    baseDairy: { skimPowderId: 'skim', butterId: 'butter', wholeMilkId: 'milk' },
    ...overrides,
  }
}

const ENFORCED = ['sugar', 'fat', 'msnf', 'otherSolids', 'totalSolids', 'perceivedSugar'] as const

describe('calculateGelato — feasible baseline', () => {
  it('finds a recipe with every enforced metric inside its band', () => {
    const result = calculateGelato(baseInputs(), BY_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const { recipe } = result
    // Weights sum to the target total.
    const sum = recipe.components.reduce((a, c) => a + c.weightG, 0)
    expect(sum).toBeCloseTo(1000, 3)
    expect(recipe.totalWeightG).toBeCloseTo(1000, 3)

    for (const key of ENFORCED) {
      const m = recipe.metrics.find((x) => x.key === key)!
      expect(m.value).not.toBeNull()
      expect(m.inRange, `${key} = ${m.value?.toFixed(2)} should be in ${m.range?.min}-${m.range?.max}`).toBe(true)
    }
  })

  it('places the 3×3 solution so fat and MSNF land inside their bands', () => {
    const result = calculateGelato(baseInputs(), BY_ID)
    if (!result.ok) throw new Error('expected feasible')
    const fat = result.recipe.metrics.find((m) => m.key === 'fat')!
    const msnf = result.recipe.metrics.find((m) => m.key === 'msnf')!
    expect(fat.value!).toBeGreaterThanOrEqual(4)
    expect(fat.value!).toBeLessThanOrEqual(18)
    expect(msnf.value!).toBeGreaterThanOrEqual(8)
    expect(msnf.value!).toBeLessThanOrEqual(12)
  })
})

describe('calculateGelato — Step 1 all unused', () => {
  it('still solves with pure dairy + free material', () => {
    const inputs = baseInputs({
      step1: [
        { ingredientId: 'sucrose', use: false, minPct: 14, maxPct: 20 },
        { ingredientId: 'stab', use: false, minPct: 0.3, maxPct: 0.5 },
      ],
      free: [{ ingredientId: 'sucrose', weightG: 180 }],
      ranges: { ...structuredClone(DEFAULT_GELATO_RANGES), perceivedSugar: { min: 5, max: 63 } },
    })
    const result = calculateGelato(inputs, BY_ID)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.recipe.components.some((c) => c.role === 'step1')).toBe(false)
    expect(result.recipe.components.filter((c) => c.role === 'base')).toHaveLength(3)
  })
})

describe('calculateGelato — degenerate base dairy', () => {
  it('returns reason:error when the trio has collinear fat/MSNF profiles', () => {
    const milkA = ing({ id: 'a', name: 'A', waterPct: 88, fatPct: 3, nonFatSolidsPct: 9 })
    const milkB = ing({ id: 'b', name: 'B', waterPct: 82, fatPct: 6, nonFatSolidsPct: 12 })
    const milkC = ing({ id: 'c', name: 'C', waterPct: 85, fatPct: 4.5, nonFatSolidsPct: 10.5 }) // exactly (A+B)/2
    const byId: IngredientsById = new Map([milkA, milkB, milkC, sucrose, stabilizer].map((i) => [i.id, i]))
    const result = calculateGelato(
      baseInputs({ baseDairy: { skimPowderId: 'a', butterId: 'b', wholeMilkId: 'c' } }),
      byId
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('error')
  })
})

describe('calculateGelato — infeasible', () => {
  it('reports totalSolids 偏高 when a big free material overshoots the band', () => {
    const inputs = baseInputs({
      // 700g of a 100%-solids paste on a 1000g batch → ~70% solids floor, way over 32-42.
      free: [{ ingredientId: 'pist', weightG: 700 }],
    })
    const result = calculateGelato(inputs, BY_ID)
    expect(result.ok).toBe(false)
    if (result.ok) return
    // Could be flagged as infeasible (band) or error (negative dairy) — both name the overshoot.
    if (result.reason === 'infeasible') {
      const ts = result.violations.find((v) => v.key === 'totalSolids')
      expect(ts).toBeDefined()
      expect(ts!.direction).toBe('偏高')
      expect(result.closest.components.length).toBeGreaterThan(0)
    } else {
      expect(result.reason).toBe('error')
    }
  })

  it('reports a violation when Total Solids band is squeezed too tight', () => {
    const inputs = baseInputs({
      ranges: { ...structuredClone(DEFAULT_GELATO_RANGES), totalSolids: { min: 20, max: 24 } },
    })
    const result = calculateGelato(inputs, BY_ID)
    expect(result.ok).toBe(false)
    if (result.ok || result.reason !== 'infeasible') return
    expect(result.violations.some((v) => v.key === 'totalSolids')).toBe(true)
    expect(result.hint).toContain('Total Solids')
  })
})

describe('calculateGelato — input guards', () => {
  it('errors when a base dairy is not selected', () => {
    const result = calculateGelato(
      baseInputs({ baseDairy: { skimPowderId: '', butterId: 'butter', wholeMilkId: 'milk' } }),
      BY_ID
    )
    expect(result.ok).toBe(false)
    if (result.ok || result.reason !== 'error') throw new Error('expected reason:error')
    expect(result.message).toContain('基礎乳製品')
  })

  it('errors on non-positive total weight', () => {
    const result = calculateGelato(baseInputs({ totalWeightG: 0 }), BY_ID)
    expect(result.ok).toBe(false)
  })
})

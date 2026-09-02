import type { Ingredient } from '@/lib/calculator/types'
import type { GelatoInputs, MetricRange } from './types'

/** STEP 0 — the fixed final-formula acceptance ranges. Not editable anywhere. */
export const STEP0_RANGES = {
  sugar: { min: 16, max: 22 },
  fat: { min: 4, max: 12 },
  msnf: { min: 8, max: 12 },
  otherSolids: { min: 0, max: 5 },
  fatPlusMsnf: { min: 16, max: 22 },
  totalSolids: { min: 32, max: 42 },
  perceivedSugar: { min: 16, max: 23 },
} satisfies Record<string, MetricRange>

export const STEP0_ROWS: { key: keyof typeof STEP0_RANGES; label: string }[] = [
  { key: 'sugar', label: 'Sugar 糖分' },
  { key: 'fat', label: 'Fat 脂肪' },
  { key: 'msnf', label: 'MSNF 無脂固形物' },
  { key: 'otherSolids', label: 'Other Solids 其他固形物' },
  { key: 'fatPlusMsnf', label: 'Fat + MSNF 脂肪＋無脂固形物' },
  { key: 'totalSolids', label: 'Total Solids 固形物總和' },
  { key: 'perceivedSugar', label: 'Perceived Sugar 有感糖' },
]

function findByName(ingredients: Ingredient[], ...names: string[]): string {
  for (const n of names) {
    const hit = ingredients.find((i) => i.name === n)
    if (hit) return hit.id
  }
  return ''
}

/** Sensible starting inputs — name-matches the conventional ingredients where they
 *  exist, otherwise leaves the dropdown empty for the user to pick. */
export function defaultGelatoInputs(ingredients: Ingredient[]): GelatoInputs {
  return {
    totalWeightG: 1000,
    fatTargetPct: 8,
    msnfTargetPct: 10,
    sucrosePct: 12,
    stabilizerPct: 0.5,
    eggYolkPct: 0,
    sucroseId: findByName(ingredients, '蔗糖', '砂糖'),
    stabilizerId: findByName(ingredients, '穩定劑', '膠體'),
    eggYolkId: findByName(ingredients, '蛋黃'),
    flavourMaterials: [],
    fixedMaterials: [],
    baseX: findByName(ingredients, '全脂牛奶'),
    baseY: findByName(ingredients, '動物性鮮奶油35%', '動物性鮮奶油38%', '鮮奶油', '奶油'),
    baseZ: findByName(ingredients, '脫脂奶粉'),
  }
}

export function checkStep0(actual: number, range: MetricRange): { pass: boolean; overBy: number } {
  const pass = actual >= range.min - 1e-9 && actual <= range.max + 1e-9
  const overBy = pass ? 0 : actual < range.min ? range.min - actual : actual - range.max
  return { pass, overBy }
}

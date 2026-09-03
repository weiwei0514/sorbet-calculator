import type { Ingredient } from '@/lib/calculator/types'

/**
 * Three dairy ingredients compute their POD/PAC contribution from a FIXED fraction
 * of their weight (their lactose-ish basis), not from their sugar %:
 *   牛奶            weight × 4.8%  × 資料庫 POD/PAC 係數
 *   脫脂奶粉        weight × 97%   × 資料庫 POD/PAC 係數
 *   動物性鮮奶油    weight × 2.8%  × 資料庫 POD/PAC 係數
 * Every other ingredient keeps the normal basis: its sugar grams.
 *
 * Matching is deliberately narrow so lookalikes stay on the normal path:
 * "牛奶巧克力" ends with 巧克力 (not 牛奶) and is unaffected.
 */
const SPECIAL_BASIS: { test: (name: string) => boolean; fraction: number }[] = [
  { test: (n) => n.endsWith('奶粉'), fraction: 0.97 }, // 脫脂奶粉 / 全脂奶粉
  { test: (n) => n.includes('鮮奶油'), fraction: 0.028 }, // 動物性鮮奶油35% / 38%
  { test: (n) => n.endsWith('牛奶'), fraction: 0.048 }, // 全脂 / 半脂 / 脫脂牛奶
]

/** Grams of the ingredient that POD/PAC coefficients multiply against. */
export function podPacBasisG(ingredient: Ingredient, weightG: number): number {
  const special = SPECIAL_BASIS.find((s) => s.test(ingredient.name))
  if (special) return weightG * special.fraction
  return weightG * (ingredient.sugarPct / 100)
}

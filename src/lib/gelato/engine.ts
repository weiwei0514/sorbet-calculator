import type { Ingredient } from '@/lib/calculator/types'
import { accumulate, type WeightedIngredient } from './nutrition'
import { solveBase } from './solve3x3'
import type {
  GelatoComponent,
  GelatoInputs,
  GelatoRecipeSnapshot,
  GelatoResult,
  IngredientsById,
} from './types'

function amountToGrams(amount: number, unit: 'g' | 'pct', totalWeightG: number): number {
  return unit === 'g' ? amount : (amount / 100) * totalWeightG
}

function err(message: string, detail?: string): GelatoResult {
  return { ok: false, reason: 'error', message, detail }
}

/**
 * The deterministic Gelato pipeline:
 *   STEP 1 targets → add flavour + fixed materials → subtract every fixed
 *   component from the targets → 3×3 solve for X/Y/Z → recombine → recompute
 *   every metric from scratch → STEP 0 acceptance check.
 * No optimisation, no search: given valid inputs there is exactly one recipe.
 */
export function calculateGelato(inputs: GelatoInputs, byId: IngredientsById): GelatoResult {
  const W = inputs.totalWeightG
  if (!(W > 0)) return err('STEP 1 的最終總重量需大於 0。')

  // ---- resolve STEP 1 fixed-role ingredients -------------------------------
  const sucrose = byId.get(inputs.sucroseId)
  const stabilizer = byId.get(inputs.stabilizerId)
  if (!sucrose) return err('請在 STEP 1 選擇「蔗糖」對應的食材。')
  if (!stabilizer) return err('請在 STEP 1 選擇「膠體／穩定劑」對應的食材。')
  const usesEggYolk = inputs.eggYolkPct > 0
  const eggYolk = usesEggYolk ? byId.get(inputs.eggYolkId) : undefined
  if (usesEggYolk && !eggYolk) return err('蛋黃比例大於 0，但尚未在 STEP 1 選擇蛋黃對應的食材。')

  // ---- resolve STEP 2C base ingredients ------------------------------------
  const baseX = byId.get(inputs.baseX)
  const baseY = byId.get(inputs.baseY)
  const baseZ = byId.get(inputs.baseZ)
  if (!baseX || !baseY || !baseZ) return err('請在 STEP 2 選擇三個主要基底食材（X / Y / Z）。')

  // ---- STEP 1 fixed entries ----------------------------------------------
  const fixedEntries: { entry: WeightedIngredient; role: GelatoComponent['role'] }[] = []
  const pushFixed = (ing: Ingredient, weightG: number, role: GelatoComponent['role']) => {
    if (weightG > 0) fixedEntries.push({ entry: { ingredient: ing, weightG }, role })
  }

  pushFixed(sucrose, (inputs.sucrosePct / 100) * W, 'step1')
  pushFixed(stabilizer, (inputs.stabilizerPct / 100) * W, 'step1')
  if (eggYolk) pushFixed(eggYolk, (inputs.eggYolkPct / 100) * W, 'step1')

  // ---- STEP 2 flavour + other fixed materials ---------------------------
  for (const m of inputs.flavourMaterials) {
    const ing = byId.get(m.ingredientId)
    if (!ing) return err('STEP 2 的風味食材有一項在資料庫中找不到，請重新選擇。')
    pushFixed(ing, amountToGrams(m.amount, m.unit, W), 'flavour')
  }
  for (const m of inputs.fixedMaterials) {
    const ing = byId.get(m.ingredientId)
    if (!ing) return err('STEP 2 的固定食材有一項在資料庫中找不到，請重新選擇。')
    pushFixed(ing, amountToGrams(m.amount, m.unit, W), 'fixed')
  }

  // ---- STEP 2-2 .. 2-4: subtract every fixed component -------------------
  const fixedTotals = accumulate(fixedEntries.map((f) => f.entry))

  const fatTargetG = (inputs.fatTargetPct / 100) * W
  const msnfTargetG = (inputs.msnfTargetPct / 100) * W

  const remaining = {
    weightG: W - fixedTotals.weightG,
    fatG: fatTargetG - fixedTotals.fatG,
    msnfG: msnfTargetG - fixedTotals.msnfG,
  }

  if (remaining.weightG <= 0) {
    return err(
      '固定食材（STEP 1 + STEP 2）的總重量已達到或超過最終總重量，沒有空間放基底食材。',
      `固定食材共 ${fixedTotals.weightG.toFixed(1)} g，最終總重量 ${W} g。`
    )
  }

  // ---- STEP 2-5: three-variable linear solve ----------------------------
  const solve = solveBase(baseX, baseY, baseZ, {
    remainingWeightG: remaining.weightG,
    remainingFatG: remaining.fatG,
    remainingMsnfG: remaining.msnfG,
  })
  if (!solve.ok) {
    return err(
      '❌ 無唯一解',
      `所選三個基底食材（${baseX.name} / ${baseY.name} / ${baseZ.name}）的脂肪與 MSNF 組成呈線性相關，三元一次方程式沒有唯一解。請至少換掉其中一個。`
    )
  }

  const { xG, yG, zG } = solve.amounts
  const NEG_TOL = -0.05
  const negatives: string[] = []
  if (xG < NEG_TOL) negatives.push(`${baseX.name}（X）= ${xG.toFixed(1)} g`)
  if (yG < NEG_TOL) negatives.push(`${baseY.name}（Y）= ${yG.toFixed(1)} g`)
  if (zG < NEG_TOL) negatives.push(`${baseZ.name}（Z）= ${zG.toFixed(1)} g`)
  if (negatives.length > 0) {
    return err(
      '❌ 無法產生合理配方',
      `三元一次方程式解出負重量：${negatives.join('、')}。` +
        `目前 Remaining Weight ${remaining.weightG.toFixed(1)} g、Remaining Fat ${remaining.fatG.toFixed(1)} g、` +
        `Remaining MSNF ${remaining.msnfG.toFixed(1)} g，三個基底食材無法同時滿足。` +
        `通常代表 STEP 1 的 Fat 或 MSNF 目標、或風味／固定食材帶入的脂肪與 MSNF 互相衝突。請調整這些設定，系統不會自行更動你的目標。`
    )
  }

  // ---- STEP 3: recombine and recompute everything from scratch ----------
  const clamp = (v: number) => (Math.abs(v) < 1e-6 ? 0 : v)
  const baseEntries: { entry: WeightedIngredient; role: GelatoComponent['role'] }[] = [
    { entry: { ingredient: baseX, weightG: clamp(xG) }, role: 'base' },
    { entry: { ingredient: baseY, weightG: clamp(yG) }, role: 'base' },
    { entry: { ingredient: baseZ, weightG: clamp(zG) }, role: 'base' },
  ]
  const allEntries = [...fixedEntries, ...baseEntries]
  const totals = accumulate(allEntries.map((e) => e.entry))

  // Merge duplicate ingredients (e.g. same DB row picked twice) into one row.
  const merged = new Map<string, { ingredient: Ingredient; role: GelatoComponent['role']; weightG: number }>()
  for (const { entry, role } of allEntries) {
    const key = `${role}:${entry.ingredient.id}`
    const prev = merged.get(key)
    if (prev) prev.weightG += entry.weightG
    else merged.set(key, { ingredient: entry.ingredient, role, weightG: entry.weightG })
  }
  const components: GelatoComponent[] = [...merged.values()].map(({ ingredient, role, weightG }) => {
    const sugarG = weightG * (ingredient.sugarPct / 100)
    return {
      ingredientId: ingredient.id,
      name: ingredient.name,
      role,
      weightG,
      pctOfTotal: (weightG / W) * 100,
      sugarG,
      podCoefficient: ingredient.podCoefficient,
      pacCoefficient: ingredient.pacCoefficient,
      podContributionG: sugarG * (ingredient.podCoefficient ?? 0),
      pacContributionG: sugarG * (ingredient.pacCoefficient ?? 0),
    }
  })

  const pct = (g: number) => (g / W) * 100
  const recipe: GelatoRecipeSnapshot = {
    components,
    totalWeightG: totals.weightG,
    breakdown: {
      waterG: totals.waterG,
      waterPct: pct(totals.waterG),
      sugarG: totals.sugarG,
      sugarPct: pct(totals.sugarG),
      otherSolidsG: totals.otherSolidsG,
      otherSolidsPct: pct(totals.otherSolidsG),
      totalSolidsG: totals.totalSolidsG,
      totalSolidsPct: pct(totals.totalSolidsG),
    },
    podTotal: totals.podG,
    pacTotal: totals.pacG,
    podPer1000g: (totals.podG / W) * 1000,
    pacPer1000g: (totals.pacG / W) * 1000,
    base: { xG: clamp(xG), yG: clamp(yG), zG: clamp(zG) },
    remaining,
  }
  return { ok: true, recipe }
}

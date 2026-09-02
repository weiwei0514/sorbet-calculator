import type { Ingredient } from '@/lib/calculator/types'
import {
  ENFORCED_METRIC_KEYS,
  accumulate,
  addTotals,
  metricsFromTotals,
  ZERO_TOTALS,
  type Totals,
  type WeightedIngredient,
} from './nutrition'
import { minimize } from './optimize'
import { solveBaseDairy } from './solve3x3'
import type {
  GelatoComponent,
  GelatoInputs,
  GelatoMetric,
  GelatoMetricKey,
  GelatoRecipeSnapshot,
  GelatoResult,
  GelatoViolation,
  IngredientsById,
  MetricRange,
} from './types'

/** Feasibility tolerance for a metric being "in band" after optimisation. */
const FEASIBLE_TOL = 0.05

interface UsedStep1 {
  ingredient: Ingredient
  minG: number
  maxG: number
}

interface Assembled {
  components: GelatoComponent[]
  totals: Totals
  base: { skimPowderG: number; butterG: number; wholeMilkG: number }
  degenerate: boolean
  minBase: number
}

function rangeOf(ranges: GelatoInputs['ranges'], key: GelatoMetricKey): MetricRange | null {
  switch (key) {
    case 'sugar':
      return ranges.sugar
    case 'fat':
      return ranges.fat
    case 'msnf':
      return ranges.msnf
    case 'otherSolids':
      return ranges.otherSolids
    case 'totalSolids':
      return ranges.totalSolids
    case 'perceivedSugar':
      return ranges.perceivedSugar
    case 'pac':
      return ranges.pac
    default:
      return null
  }
}

/** Builds the full recipe for a given search point x and returns its totals. */
function assemble(
  x: number[],
  ctx: {
    W: number
    used: UsedStep1[]
    fixedFree: { totals: Totals; components: GelatoComponent[] }
    ranges: GelatoInputs['ranges']
    skim: Ingredient
    butter: Ingredient
    wholeMilk: Ingredient
  }
): Assembled {
  const { W, used, fixedFree, ranges, skim, butter, wholeMilk } = ctx

  // First `used.length` vars pick each Step 1 weight within its band.
  const step1Entries: WeightedIngredient[] = used.map((u, i) => {
    const frac = x[i]
    return { ingredient: u.ingredient, weightG: u.minG + frac * (u.maxG - u.minG) }
  })
  // Last two vars pick the fat / MSNF target within their bands.
  const fFat = x[used.length]
  const fMsnf = x[used.length + 1]
  const fatTargetG = ((ranges.fat.min + fFat * (ranges.fat.max - ranges.fat.min)) / 100) * W
  const msnfTargetG = ((ranges.msnf.min + fMsnf * (ranges.msnf.max - ranges.msnf.min)) / 100) * W

  const step1Totals = accumulate(step1Entries)
  const knownTotals = addTotals(step1Totals, fixedFree.totals)
  const remainingG = W - knownTotals.weightG

  const solve = solveBaseDairy(skim, butter, wholeMilk, {
    remainingG,
    fatFromDairyG: fatTargetG - knownTotals.fatG,
    msnfFromDairyG: msnfTargetG - knownTotals.msnfG,
  })

  if (!solve.ok) {
    return { components: [], totals: ZERO_TOTALS, base: { skimPowderG: 0, butterG: 0, wholeMilkG: 0 }, degenerate: true, minBase: -Infinity }
  }

  const { skimPowderG, butterG, wholeMilkG } = solve.amounts
  const baseEntries: WeightedIngredient[] = [
    { ingredient: skim, weightG: skimPowderG },
    { ingredient: butter, weightG: butterG },
    { ingredient: wholeMilk, weightG: wholeMilkG },
  ]
  const totals = addTotals(knownTotals, accumulate(baseEntries))

  const step1Components: GelatoComponent[] = step1Entries.map((e) => ({
    ingredientId: e.ingredient.id,
    name: e.ingredient.name,
    role: 'step1' as const,
    weightG: e.weightG,
    pctOfTotal: (e.weightG / W) * 100,
  }))
  const baseComponents: GelatoComponent[] = [
    { ingredientId: skim.id, name: skim.name, role: 'base' as const, weightG: skimPowderG, pctOfTotal: (skimPowderG / W) * 100 },
    { ingredientId: butter.id, name: butter.name, role: 'base' as const, weightG: butterG, pctOfTotal: (butterG / W) * 100 },
    { ingredientId: wholeMilk.id, name: wholeMilk.name, role: 'base' as const, weightG: wholeMilkG, pctOfTotal: (wholeMilkG / W) * 100 },
  ]

  return {
    components: [...step1Components, ...fixedFree.components, ...baseComponents],
    totals,
    base: { skimPowderG, butterG, wholeMilkG },
    degenerate: false,
    minBase: Math.min(skimPowderG, butterG, wholeMilkG, remainingG),
  }
}

function violationScore(metrics: GelatoMetric[], ranges: GelatoInputs['ranges']): number {
  let score = 0
  for (const key of ENFORCED_METRIC_KEYS) {
    const range = rangeOf(ranges, key)
    const metric = metrics.find((m) => m.key === key)
    if (!range || !metric || metric.value == null) continue
    const half = Math.max((range.max - range.min) / 2, 0.5)
    score += Math.max(0, range.min - metric.value, metric.value - range.max) / half
  }
  return score
}

function centeringScore(metrics: GelatoMetric[], ranges: GelatoInputs['ranges']): number {
  let score = 0
  for (const key of ENFORCED_METRIC_KEYS) {
    const range = rangeOf(ranges, key)
    const metric = metrics.find((m) => m.key === key)
    if (!range || !metric || metric.value == null) continue
    const half = Math.max((range.max - range.min) / 2, 0.5)
    const center = (range.min + range.max) / 2
    score += ((metric.value - center) / half) ** 2
  }
  return score
}

function snapshot(assembled: Assembled, W: number, ranges: GelatoInputs['ranges']): GelatoRecipeSnapshot {
  // Clamp tiny negative dairy weights that are just solver noise.
  const components = assembled.components.map((c) => ({
    ...c,
    weightG: Math.abs(c.weightG) < 1e-6 ? 0 : c.weightG,
  }))
  const metrics = metricsFromTotals(assembled.totals, W, ranges)
  return {
    components,
    totalWeightG: assembled.totals.weightG,
    metrics,
    podTotal: assembled.totals.podG,
    pacTotal: assembled.totals.pacG,
    waterPct: (assembled.totals.waterG / (W || 1)) * 100,
  }
}

function buildViolations(metrics: GelatoMetric[], ranges: GelatoInputs['ranges']): GelatoViolation[] {
  const out: GelatoViolation[] = []
  for (const key of ENFORCED_METRIC_KEYS) {
    const range = rangeOf(ranges, key)
    const metric = metrics.find((m) => m.key === key)
    if (!range || !metric || metric.value == null) continue
    if (metric.value < range.min - FEASIBLE_TOL) {
      out.push({ key, label: metric.label, achieved: metric.value, range, direction: '偏低' })
    } else if (metric.value > range.max + FEASIBLE_TOL) {
      out.push({ key, label: metric.label, achieved: metric.value, range, direction: '偏高' })
    }
  }
  return out
}

export function calculateGelato(inputs: GelatoInputs, ingredientsById: IngredientsById): GelatoResult {
  const W = inputs.totalWeightG
  if (!(W > 0)) {
    return { ok: false, reason: 'error', message: '最終配方重量需大於 0' }
  }

  const skim = ingredientsById.get(inputs.baseDairy.skimPowderId)
  const butter = ingredientsById.get(inputs.baseDairy.butterId)
  const wholeMilk = ingredientsById.get(inputs.baseDairy.wholeMilkId)
  if (!skim || !butter || !wholeMilk) {
    return { ok: false, reason: 'error', message: '請先在下方選擇三種基礎乳製品（脫脂奶粉 / 奶油 / 全脂牛奶）' }
  }

  // Step 1 — used materials become search variables; unused contribute nothing.
  const used: UsedStep1[] = []
  for (const s of inputs.step1) {
    if (!s.use) continue
    const ing = ingredientsById.get(s.ingredientId)
    if (!ing) return { ok: false, reason: 'error', message: `Step 1 有一項材料在資料庫中找不到` }
    const lo = Math.min(s.minPct, s.maxPct)
    const hi = Math.max(s.minPct, s.maxPct)
    used.push({ ingredient: ing, minG: (lo / 100) * W, maxG: (hi / 100) * W })
  }

  // Step 2 — free materials at fixed weights the solver never touches.
  const freeEntries: WeightedIngredient[] = []
  for (const f of inputs.free) {
    const ing = ingredientsById.get(f.ingredientId)
    if (!ing) return { ok: false, reason: 'error', message: `新增食材有一項在資料庫中找不到` }
    if (f.weightG > 0) freeEntries.push({ ingredient: ing, weightG: f.weightG })
  }
  const fixedFree = {
    totals: accumulate(freeEntries),
    components: freeEntries.map<GelatoComponent>((e) => ({
      ingredientId: e.ingredient.id,
      name: e.ingredient.name,
      role: 'free',
      weightG: e.weightG,
      pctOfTotal: (e.weightG / W) * 100,
    })),
  }

  const ctx = { W, used, fixedFree, ranges: inputs.ranges, skim, butter, wholeMilk }
  const dim = used.length + 2

  // Detect a degenerate base-dairy trio up front (independent of the search point).
  const probe = assemble(new Array(dim).fill(0.5), ctx)
  if (probe.degenerate) {
    return {
      ok: false,
      reason: 'error',
      message: '所選三種基礎乳製品的脂肪／MSNF 組成太接近，無法建立三元一次方程式，請換一組',
    }
  }

  const objective = (x: number[], mode: 'full' | 'feasibleOnly'): number => {
    const a = assemble(x, ctx)
    if (a.degenerate) return 1e12
    const negPenalty = Math.max(0, -a.minBase)
    const metrics = metricsFromTotals(a.totals, W, inputs.ranges)
    const viol = violationScore(metrics, inputs.ranges)
    if (mode === 'feasibleOnly') {
      return 1e6 * negPenalty + 1e4 * viol
    }
    const centering = centeringScore(metrics, inputs.ranges)
    const dairyImbalance =
      (Math.max(a.base.skimPowderG, a.base.butterG, a.base.wholeMilkG) -
        Math.min(a.base.skimPowderG, a.base.butterG, a.base.wholeMilkG)) /
      (W || 1)
    let step1Pull = 0
    for (let i = 0; i < used.length; i++) step1Pull += (x[i] - 0.5) ** 2
    return 1e6 * negPenalty + 1e4 * viol + 1.0 * centering + 0.5 * dairyImbalance + 0.3 * step1Pull
  }

  const best = minimize((x) => objective(x, 'full'), { dim })
  const bestAssembled = assemble(best.x, ctx)
  const bestMetrics = metricsFromTotals(bestAssembled.totals, W, inputs.ranges)
  const feasible =
    !bestAssembled.degenerate &&
    bestAssembled.minBase >= -FEASIBLE_TOL &&
    violationScore(bestMetrics, inputs.ranges) <= FEASIBLE_TOL

  if (feasible) {
    return { ok: true, recipe: snapshot(bestAssembled, W, inputs.ranges) }
  }

  // Second pass: genuine closest-feasible (drop the centering / aesthetic terms).
  const closestSearch = minimize((x) => objective(x, 'feasibleOnly'), { dim, starts: 16, iters: 320 })
  const closestAssembled = assemble(closestSearch.x, ctx)
  const closestSnap = snapshot(closestAssembled, W, inputs.ranges)
  const violations = buildViolations(closestSnap.metrics, inputs.ranges)

  // Negative base dairy is its own failure mode — surface it as an error, not a metric band.
  if (closestAssembled.minBase < -1) {
    return {
      ok: false,
      reason: 'error',
      message:
        '在目前的 Step 1 與新增食材設定下，三種基礎乳製品會出現負值，無法平衡。請降低新增食材用量，或放寬脂肪／MSNF 範圍。',
    }
  }

  const worst = violations.slice().sort((a, b) => {
    const da = a.direction === '偏高' ? a.achieved - a.range.max : a.range.min - a.achieved
    const db = b.direction === '偏高' ? b.achieved - b.range.max : b.range.min - b.achieved
    return db - da
  })[0]
  const largestFree = inputs.free
    .map((f) => ({ f, ing: ingredientsById.get(f.ingredientId) }))
    .filter((x) => x.ing && x.f.weightG > 0)
    .sort((a, b) => b.f.weightG - a.f.weightG)[0]

  const hint = worst
    ? `建議放寬「${worst.label}」的允許範圍` +
      (largestFree?.ing ? `，或調整新增食材「${largestFree.ing.name}」的用量` : '')
    : '請放寬其中一項指標的允許範圍'

  return { ok: false, reason: 'infeasible', violations, closest: closestSnap, hint }
}

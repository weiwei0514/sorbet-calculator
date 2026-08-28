import type {
  ComponentBreakdown,
  CompositionPct,
  Ingredient,
  PodPacTarget,
  RecipeInputs,
  RecipeResult,
  RecipeTotals,
  TargetVsActual,
  ValidationError,
} from './types'
import { DEFAULT_ENGINE_CONFIG, type EngineConfig } from './config'
import { validateIngredientComposition, validateRecipeInputs } from './validate'

export interface WeightedIngredient {
  ingredient: Ingredient
  pct: number
}

export interface CalculateRecipeArgs {
  inputs: RecipeInputs
  fruits: WeightedIngredient[]
  otherSugars: WeightedIngredient[]
  config?: EngineConfig
}

export type CalculationOutcome =
  | { ok: true; result: RecipeResult; errors: [] }
  | { ok: false; result: null; errors: ValidationError[] }

const EPSILON = 1e-9

export function calculateRecipe(args: CalculateRecipeArgs): CalculationOutcome {
  const { inputs, fruits, otherSugars, config = DEFAULT_ENGINE_CONFIG } = args

  const errors: ValidationError[] = [
    ...validateRecipeInputs(inputs),
    ...fruits.flatMap((f) => validateIngredientComposition(f.ingredient)),
    ...otherSugars.flatMap((s) => validateIngredientComposition(s.ingredient)),
  ]
  if (errors.length > 0) return { ok: false, result: null, errors }

  const { totalWeightG } = inputs

  const fruitComps = fruits.map(({ ingredient, pct }) =>
    componentFrom(`fruit-${ingredient.id}`, 'fruit', `水果：${ingredient.name}`, totalWeightG * (pct / 100), ingredient, totalWeightG)
  )
  const otherSugarComps = otherSugars.map(({ ingredient, pct }) =>
    componentFrom(
      `otherSugar-${ingredient.id}`,
      'otherSugar',
      `其他糖類：${ingredient.name}`,
      totalWeightG * (pct / 100),
      ingredient,
      totalWeightG
    )
  )

  const stabilizerWeightG = totalWeightG * (inputs.stabilizerPct / 100)
  const stabilizerComp = componentFrom(
    'stabilizer',
    'stabilizer',
    config.stabilizer.label,
    stabilizerWeightG,
    config.stabilizer,
    totalWeightG
  )

  const targetTotalSolidsG = totalWeightG * (inputs.targetTotalSolidsPct / 100)
  const knownSolidsG =
    sumBy(fruitComps, (c) => c.totalSolidsG) + sumBy(otherSugarComps, (c) => c.totalSolidsG) + stabilizerComp.totalSolidsG
  const rawSucroseWeightG = targetTotalSolidsG - knownSolidsG

  if (rawSucroseWeightG < -EPSILON) {
    errors.push({
      field: 'sucroseWeight',
      code: 'INFEASIBLE_SOLIDS',
      message: `目前設定無法達成 ${inputs.targetTotalSolidsPct}% 固形物，請降低水果比例或調整其他糖類`,
    })
  }
  const sucroseWeightG = Math.max(0, rawSucroseWeightG)
  const sucroseComp = componentFrom('sucrose', 'sucrose', config.sucrose.label, sucroseWeightG, config.sucrose, totalWeightG)

  const usedSoFarG =
    sumBy(fruitComps, (c) => c.weightG) + sumBy(otherSugarComps, (c) => c.weightG) + stabilizerComp.weightG + sucroseComp.weightG
  const rawWaterWeightG = totalWeightG - usedSoFarG

  if (rawWaterWeightG < -EPSILON) {
    errors.push({
      field: 'waterWeight',
      code: 'INFEASIBLE_WATER',
      message:
        '目前設定的水果、其他糖類、膠體與砂糖總重已超過配方總重，無法補水，請降低水果比例、其他糖類比例或膠體比例',
    })
  }
  const waterWeightG = Math.max(0, rawWaterWeightG)
  const waterComp = componentFrom(
    'water',
    'water',
    '水',
    waterWeightG,
    { waterPct: 100, sugarPct: 0, otherSolidsPct: 0, podCoefficient: 0, pacCoefficient: 0 },
    totalWeightG
  )

  if (errors.length > 0) return { ok: false, result: null, errors }

  const components: ComponentBreakdown[] = [...fruitComps, ...otherSugarComps, stabilizerComp, sucroseComp, waterComp]
  const totals = sumTotals(components, totalWeightG)

  const missingCoefficientIngredientNames: string[] = [...fruits, ...otherSugars]
    .filter(({ ingredient }) => ingredient.podCoefficient == null || ingredient.pacCoefficient == null)
    .map(({ ingredient }) => ingredient.name)

  const totalFruitPct = sumBy(fruits, (f) => f.pct)
  const totalOtherSugarPct = sumBy(otherSugars, (s) => s.pct)
  const actualFruitPct = sumBy(fruitComps, (c) => c.pctOfTotalWeight)
  const actualOtherSugarPct = sumBy(otherSugarComps, (c) => c.pctOfTotalWeight)

  const result: RecipeResult = {
    inputs,
    components,
    totals,
    comparison: {
      totalSolidsPct: compare(inputs.targetTotalSolidsPct, totals.totalSolidsPct),
      fruitPct: compare(totalFruitPct, actualFruitPct),
      otherSugarPct: compare(totalOtherSugarPct, actualOtherSugarPct),
      stabilizerPct: compare(inputs.stabilizerPct, stabilizerComp.pctOfTotalWeight),
    },
    podTarget: inputs.targetPOD == null ? null : podPacTarget(inputs.targetPOD, totals.totalPOD),
    pacTarget: inputs.targetPAC == null ? null : podPacTarget(inputs.targetPAC, totals.totalPAC),
    missingCoefficientIngredientNames,
    extraMetrics: {},
  }

  return { ok: true, result, errors: [] }
}

function sumBy<T>(items: T[], fn: (item: T) => number): number {
  return items.reduce((sum, item) => sum + fn(item), 0)
}

function componentFrom(
  key: string,
  category: ComponentBreakdown['category'],
  label: string,
  weightG: number,
  comp: CompositionPct & { podCoefficient: number | null; pacCoefficient: number | null },
  totalWeightG: number
): ComponentBreakdown {
  const waterG = weightG * (comp.waterPct / 100)
  const sugarG = weightG * (comp.sugarPct / 100)
  const otherSolidsG = weightG * (comp.otherSolidsPct / 100)
  // POD/PAC coefficients are already decimals (0.45), never divide by 100 — only sugarPct needs the /100 conversion.
  const podContributionG = sugarG * (comp.podCoefficient ?? 0)
  const pacContributionG = sugarG * (comp.pacCoefficient ?? 0)
  return {
    key,
    category,
    label,
    weightG,
    waterG,
    sugarG,
    otherSolidsG,
    totalSolidsG: sugarG + otherSolidsG,
    pctOfTotalWeight: totalWeightG > 0 ? (weightG / totalWeightG) * 100 : 0,
    podCoefficient: comp.podCoefficient,
    pacCoefficient: comp.pacCoefficient,
    podContributionG,
    pacContributionG,
  }
}

function sumTotals(components: ComponentBreakdown[], totalWeightG: number): RecipeTotals {
  const acc = components.reduce(
    (a, c) => ({
      weightG: a.weightG + c.weightG,
      waterG: a.waterG + c.waterG,
      sugarG: a.sugarG + c.sugarG,
      otherSolidsG: a.otherSolidsG + c.otherSolidsG,
      totalPOD: a.totalPOD + c.podContributionG,
      totalPAC: a.totalPAC + c.pacContributionG,
    }),
    { weightG: 0, waterG: 0, sugarG: 0, otherSolidsG: 0, totalPOD: 0, totalPAC: 0 }
  )
  const totalSolidsG = acc.sugarG + acc.otherSolidsG
  return {
    ...acc,
    totalSolidsG,
    waterPct: (acc.waterG / totalWeightG) * 100,
    sugarPct: (acc.sugarG / totalWeightG) * 100,
    otherSolidsPct: (acc.otherSolidsG / totalWeightG) * 100,
    totalSolidsPct: (totalSolidsG / totalWeightG) * 100,
    podPer1000g: totalWeightG > 0 ? (acc.totalPOD / totalWeightG) * 1000 : 0,
    pacPer1000g: totalWeightG > 0 ? (acc.totalPAC / totalWeightG) * 1000 : 0,
  }
}

function compare(target: number, actual: number): TargetVsActual {
  return { target, actual, deltaPct: actual - target }
}

function podPacTarget(target: number, actual: number): PodPacTarget {
  return { target, actual, gap: target - actual }
}

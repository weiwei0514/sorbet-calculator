import type {
  ComponentBreakdown,
  CompositionPct,
  Ingredient,
  RecipeInputs,
  RecipeResult,
  RecipeTotals,
  TargetVsActual,
  ValidationError,
} from './types'
import { DEFAULT_ENGINE_CONFIG, type EngineConfig } from './config'
import { validateIngredientComposition, validateRecipeInputs } from './validate'

export interface CalculateRecipeArgs {
  inputs: RecipeInputs
  fruit: Ingredient
  otherSugar: Ingredient
  config?: EngineConfig
}

export type CalculationOutcome =
  | { ok: true; result: RecipeResult; errors: [] }
  | { ok: false; result: null; errors: ValidationError[] }

const EPSILON = 1e-9

export function calculateRecipe(args: CalculateRecipeArgs): CalculationOutcome {
  const { inputs, fruit, otherSugar, config = DEFAULT_ENGINE_CONFIG } = args

  const errors: ValidationError[] = [
    ...validateRecipeInputs(inputs),
    ...validateIngredientComposition(fruit),
    ...validateIngredientComposition(otherSugar),
  ]
  if (errors.length > 0) return { ok: false, result: null, errors }

  const { totalWeightG } = inputs

  const fruitWeightG = totalWeightG * (inputs.fruitPct / 100)
  const fruitComp = componentFrom('fruit', `水果：${fruit.name}`, fruitWeightG, fruit, totalWeightG)

  const otherSugarWeightG = totalWeightG * (inputs.otherSugarPct / 100)
  const otherSugarComp = componentFrom(
    'otherSugar',
    `其他糖類：${otherSugar.name}`,
    otherSugarWeightG,
    otherSugar,
    totalWeightG
  )

  const stabilizerWeightG = totalWeightG * (inputs.stabilizerPct / 100)
  const stabilizerComp = componentFrom(
    'stabilizer',
    config.stabilizer.label,
    stabilizerWeightG,
    config.stabilizer,
    totalWeightG
  )

  const targetTotalSolidsG = totalWeightG * (inputs.targetTotalSolidsPct / 100)
  const knownSolidsG = fruitComp.totalSolidsG + otherSugarComp.totalSolidsG + stabilizerComp.totalSolidsG
  const rawSucroseWeightG = targetTotalSolidsG - knownSolidsG

  if (rawSucroseWeightG < -EPSILON) {
    errors.push({
      field: 'sucroseWeight',
      code: 'INFEASIBLE_SOLIDS',
      message: `目前設定無法達成 ${inputs.targetTotalSolidsPct}% 固形物，請降低水果比例或調整其他糖類`,
    })
  }
  const sucroseWeightG = Math.max(0, rawSucroseWeightG)
  const sucroseComp = componentFrom('sucrose', config.sucrose.label, sucroseWeightG, config.sucrose, totalWeightG)

  const usedSoFarG = fruitComp.weightG + otherSugarComp.weightG + stabilizerComp.weightG + sucroseComp.weightG
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
    '水',
    waterWeightG,
    { waterPct: 100, sugarPct: 0, otherSolidsPct: 0 },
    totalWeightG
  )

  if (errors.length > 0) return { ok: false, result: null, errors }

  const components: ComponentBreakdown[] = [fruitComp, otherSugarComp, stabilizerComp, sucroseComp, waterComp]
  const totals = sumTotals(components, totalWeightG)

  const result: RecipeResult = {
    inputs,
    components,
    totals,
    comparison: {
      totalSolidsPct: compare(inputs.targetTotalSolidsPct, totals.totalSolidsPct),
      fruitPct: compare(inputs.fruitPct, fruitComp.pctOfTotalWeight),
      otherSugarPct: compare(inputs.otherSugarPct, otherSugarComp.pctOfTotalWeight),
      stabilizerPct: compare(inputs.stabilizerPct, stabilizerComp.pctOfTotalWeight),
    },
    extraMetrics: {},
  }

  return { ok: true, result, errors: [] }
}

function componentFrom(
  key: string,
  label: string,
  weightG: number,
  comp: CompositionPct,
  totalWeightG: number
): ComponentBreakdown {
  const waterG = weightG * (comp.waterPct / 100)
  const sugarG = weightG * (comp.sugarPct / 100)
  const otherSolidsG = weightG * (comp.otherSolidsPct / 100)
  return {
    key,
    label,
    weightG,
    waterG,
    sugarG,
    otherSolidsG,
    totalSolidsG: sugarG + otherSolidsG,
    pctOfTotalWeight: totalWeightG > 0 ? (weightG / totalWeightG) * 100 : 0,
  }
}

function sumTotals(components: ComponentBreakdown[], totalWeightG: number): RecipeTotals {
  const acc = components.reduce(
    (a, c) => ({
      weightG: a.weightG + c.weightG,
      waterG: a.waterG + c.waterG,
      sugarG: a.sugarG + c.sugarG,
      otherSolidsG: a.otherSolidsG + c.otherSolidsG,
    }),
    { weightG: 0, waterG: 0, sugarG: 0, otherSolidsG: 0 }
  )
  const totalSolidsG = acc.sugarG + acc.otherSolidsG
  return {
    ...acc,
    totalSolidsG,
    waterPct: (acc.waterG / totalWeightG) * 100,
    sugarPct: (acc.sugarG / totalWeightG) * 100,
    otherSolidsPct: (acc.otherSolidsG / totalWeightG) * 100,
    totalSolidsPct: (totalSolidsG / totalWeightG) * 100,
  }
}

function compare(target: number, actual: number): TargetVsActual {
  return { target, actual, deltaPct: actual - target }
}

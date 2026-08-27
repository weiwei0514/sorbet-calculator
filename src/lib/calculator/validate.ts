import type { RecipeInputs, ValidationError } from './types'

export function validateRecipeInputs(inputs: RecipeInputs): ValidationError[] {
  const errors: ValidationError[] = []

  if (inputs.fruitPct < 25 || inputs.fruitPct > 60) {
    errors.push({
      field: 'fruitPct',
      code: 'OUT_OF_RANGE',
      message: `水果比例需介於 25%~60%（目前為 ${inputs.fruitPct}%）`,
    })
  }

  if (inputs.targetTotalSolidsPct < 26 || inputs.targetTotalSolidsPct > 34) {
    errors.push({
      field: 'targetTotalSolidsPct',
      code: 'OUT_OF_RANGE',
      message: `目標總固形物需介於 26%~34%（目前為 ${inputs.targetTotalSolidsPct}%）`,
    })
  }

  if (inputs.otherSugarPct < 1 || inputs.otherSugarPct > 5) {
    errors.push({
      field: 'otherSugarPct',
      code: 'OUT_OF_RANGE',
      message: `其他糖類比例需介於 1%~5%（目前為 ${inputs.otherSugarPct}%）`,
    })
  }

  if (inputs.stabilizerPct < 0) {
    errors.push({
      field: 'stabilizerPct',
      code: 'OUT_OF_RANGE',
      message: `膠體比例不可為負數（目前為 ${inputs.stabilizerPct}%）`,
    })
  }

  if (!(inputs.totalWeightG > 0)) {
    errors.push({
      field: 'totalWeightG',
      code: 'OUT_OF_RANGE',
      message: `最終配方重量需大於 0（目前為 ${inputs.totalWeightG}g）`,
    })
  }

  return errors
}

const COMPOSITION_FIELDS = [
  ['waterPct', '水分%'],
  ['sugarPct', '糖分%'],
  ['otherSolidsPct', '其他固形物%'],
] as const

/** 用於食材新增/修改表單，也在計算前作為防線再跑一次。 */
export function validateIngredientComposition(ing: {
  waterPct: number
  sugarPct: number
  otherSolidsPct: number
}): ValidationError[] {
  const errors: ValidationError[] = []

  for (const [field, label] of COMPOSITION_FIELDS) {
    const v = ing[field]
    if (v < 0 || v > 100) {
      errors.push({
        field,
        code: 'OUT_OF_RANGE',
        message: `${label} 需介於 0~100（目前為 ${v}%）`,
      })
    }
  }

  const sum = ing.waterPct + ing.sugarPct + ing.otherSolidsPct
  if (Math.abs(sum - 100) > 0.05) {
    errors.push({
      field: 'composition',
      code: 'COMPOSITION_NOT_100',
      message: `水分% + 糖分% + 其他固形物% 總和需等於 100%（目前為 ${sum.toFixed(2)}%）`,
    })
  }

  return errors
}

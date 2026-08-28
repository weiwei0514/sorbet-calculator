import type { RecipeInputs, ValidationError } from './types'

export function validateRecipeInputs(inputs: RecipeInputs): ValidationError[] {
  const errors: ValidationError[] = []

  if (inputs.fruits.length === 0) {
    errors.push({ field: 'fruits', code: 'REQUIRED', message: '請至少新增一種水果' })
  } else {
    inputs.fruits.forEach((f, i) => {
      if (!(f.pct > 0)) {
        errors.push({
          field: 'fruits',
          code: 'OUT_OF_RANGE',
          message: `第 ${i + 1} 項水果比例需大於 0（目前為 ${f.pct}%）`,
        })
      }
    })
    const totalFruitPct = inputs.fruits.reduce((sum, f) => sum + f.pct, 0)
    if (totalFruitPct < 25 || totalFruitPct > 60) {
      errors.push({
        field: 'fruits',
        code: 'OUT_OF_RANGE',
        message: `水果比例總和需介於 25%~60%（目前總和為 ${totalFruitPct.toFixed(1)}%）`,
      })
    }
  }

  if (inputs.targetTotalSolidsPct < 26 || inputs.targetTotalSolidsPct > 34) {
    errors.push({
      field: 'targetTotalSolidsPct',
      code: 'OUT_OF_RANGE',
      message: `目標總固形物需介於 26%~34%（目前為 ${inputs.targetTotalSolidsPct}%）`,
    })
  }

  if (inputs.otherSugars.length === 0) {
    errors.push({ field: 'otherSugars', code: 'REQUIRED', message: '請至少新增一種其他糖類' })
  } else {
    inputs.otherSugars.forEach((s, i) => {
      if (!(s.pct > 0)) {
        errors.push({
          field: 'otherSugars',
          code: 'OUT_OF_RANGE',
          message: `第 ${i + 1} 項其他糖類比例需大於 0（目前為 ${s.pct}%）`,
        })
      }
    })
    const totalOtherSugarPct = inputs.otherSugars.reduce((sum, s) => sum + s.pct, 0)
    if (totalOtherSugarPct < 1 || totalOtherSugarPct > 5) {
      errors.push({
        field: 'otherSugars',
        code: 'OUT_OF_RANGE',
        message: `其他糖類比例總和需介於 1%~5%（目前總和為 ${totalOtherSugarPct.toFixed(1)}%）`,
      })
    }
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
  ['fatPct', '油脂%'],
  ['nonFatSolidsPct', '無脂固形物%'],
  ['otherSolidsPct', '其他固形物%'],
] as const

/** 用於食材新增/修改表單，也在計算前作為防線再跑一次。 */
export function validateIngredientComposition(ing: {
  waterPct: number
  sugarPct: number
  fatPct: number
  nonFatSolidsPct: number
  otherSolidsPct: number
  podCoefficient?: number | null
  pacCoefficient?: number | null
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

  const sum = ing.waterPct + ing.sugarPct + ing.fatPct + ing.nonFatSolidsPct + ing.otherSolidsPct
  if (Math.abs(sum - 100) > 0.05) {
    errors.push({
      field: 'composition',
      code: 'COMPOSITION_NOT_100',
      message: `水分% + 糖分% + 油脂% + 無脂固形物% + 其他固形物% 總和需等於 100%（目前為 ${sum.toFixed(2)}%）`,
    })
  }

  if (ing.podCoefficient != null && ing.podCoefficient < 0) {
    errors.push({ field: 'podCoefficient', code: 'OUT_OF_RANGE', message: 'POD 係數不可為負數' })
  }
  if (ing.pacCoefficient != null && ing.pacCoefficient < 0) {
    errors.push({ field: 'pacCoefficient', code: 'OUT_OF_RANGE', message: 'PAC 係數不可為負數' })
  }

  return errors
}

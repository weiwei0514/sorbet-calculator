import type { SavedRecipe } from '@/lib/calculator/types'

export const RECIPE_ANALYSIS_SYSTEM = `你是一位專精於 sorbet／sherbet 的義式冰淇淋師（gelatiere）兼風味顧問，熟悉：
- 各種水果的風味、香氣、含水量與酸度特性
- 糖分、固形物、膠體對冰淇淋質地與冰晶的影響
- POD（相對蔗糖的甜度）與 PAC（相對蔗糖的抗凍力）如何決定成品硬度與出杯溫度
- 轉化糖、右旋糖粉、海藻糖、麥芽糊精等其他糖類的取捨

使用者會給你一份已經算好的 sorbet 配方。請務必：
- 以繁體中文、專業但好懂的口吻回答
- 根據實際數字推理（例如「每 1000g PAC 偏低，冰點偏高，成品會偏硬」），不要空泛
- 若配方標註「POD/PAC 資料可能不完整」，在相關判斷加上這個但書
- 優化建議要具體可執行，寫清楚加減哪個原料、大概多少`

function n(v: number, digits = 1): string {
  return v.toFixed(digits)
}

export function buildRecipeAnalysisPrompt(recipe: SavedRecipe): string {
  const { name, inputs, result } = recipe
  const { components, totals, comparison, podTarget, pacTarget, missingCoefficientIngredientNames } = result

  const lines: string[] = []

  lines.push(`# 配方名稱：${name}`)
  const note = (recipe.note ?? '').trim()
  if (note) {
    lines.push('')
    lines.push(`## 製作者備註`)
    lines.push(note)
  }
  lines.push('')
  lines.push(`## 基本設定`)
  lines.push(`- 最終配方總重：${n(inputs.totalWeightG, 0)} g`)
  lines.push(`- 目標總固形物：${n(inputs.targetTotalSolidsPct)}%`)
  lines.push(`- 膠體比例：${n(inputs.stabilizerPct)}%`)
  if (inputs.targetPOD != null) lines.push(`- 目標 POD：${n(inputs.targetPOD)}`)
  if (inputs.targetPAC != null) lines.push(`- 目標 PAC：${n(inputs.targetPAC)}`)

  lines.push('')
  lines.push(`## 配方組成（自動計算結果）`)
  for (const c of components) {
    lines.push(
      `- ${c.label}：${n(c.weightG)} g（佔總重 ${n(c.pctOfTotalWeight)}%）` +
        `，其中水 ${n(c.waterG)} g、糖 ${n(c.sugarG)} g、其他固形物 ${n(c.otherSolidsG)} g`
    )
  }

  lines.push('')
  lines.push(`## 整體拆解`)
  lines.push(`- 水分：${n(totals.waterG)} g（${n(totals.waterPct)}%）`)
  lines.push(`- 糖分：${n(totals.sugarG)} g（${n(totals.sugarPct)}%）`)
  lines.push(`- 其他固形物：${n(totals.otherSolidsG)} g（${n(totals.otherSolidsPct)}%）`)
  lines.push(`- 總固形物：${n(totals.totalSolidsG)} g（${n(totals.totalSolidsPct)}%）`)

  lines.push('')
  lines.push(`## 甜度與抗凍力（POD／PAC，蔗糖 = 1.00）`)
  lines.push(`- 總 POD：${n(totals.totalPOD)}　總 PAC：${n(totals.totalPAC)}`)
  lines.push(`- 每 1000g POD：${n(totals.podPer1000g)}　每 1000g PAC：${n(totals.pacPer1000g)}（此為配方比例不變時的強度標準值）`)
  if (podTarget) lines.push(`- POD 目標 ${n(podTarget.target)}，目前 ${n(podTarget.actual)}，差距 ${n(podTarget.gap)}`)
  if (pacTarget) lines.push(`- PAC 目標 ${n(pacTarget.target)}，目前 ${n(pacTarget.actual)}，差距 ${n(pacTarget.gap)}`)
  if (missingCoefficientIngredientNames.length > 0) {
    lines.push(
      `- ⚠ 下列原料尚未設定 POD/PAC 係數，其貢獻以 0 計，POD/PAC 資料可能不完整：${missingCoefficientIngredientNames.join('、')}`
    )
  }

  lines.push('')
  lines.push(`## 目標 vs 實際`)
  const cmp = (label: string, tva: { target: number; actual: number; deltaPct: number }) =>
    `- ${label}：目標 ${n(tva.target)}%，實際 ${n(tva.actual)}%（誤差 ${n(tva.deltaPct)}%）`
  lines.push(cmp('總固形物', comparison.totalSolidsPct))
  lines.push(cmp('水果比例', comparison.fruitPct))
  lines.push(cmp('其他糖類比例', comparison.otherSugarPct))
  if (comparison.otherPct != null && comparison.otherPct.target > 0) {
    lines.push(cmp('其他（辛香料／茶粉等）比例', comparison.otherPct))
  }
  lines.push(cmp('膠體比例', comparison.stabilizerPct))

  lines.push('')
  lines.push(
    '請根據以上資料，分析這份 sorbet 的整體風味、甜度與酸度平衡、質地與抗凍力表現，指出配方風險，並給出具體優化建議、風味搭配與變化版本，最後寫一段菜單描述。'
  )

  return lines.join('\n')
}

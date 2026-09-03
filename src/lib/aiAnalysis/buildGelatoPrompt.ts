import type { SavedGelatoRecipe } from '@/lib/calculator/types'
import { STEP0_RANGES } from '@/lib/gelato/defaults'
import { estimateStorageTemp, formatStorageTemp } from '@/lib/calculator/storageTemp'

export const GELATO_ANALYSIS_SYSTEM = `你是一位專精於義式 gelato 的冰淇淋師（gelatiere）兼配方顧問，熟悉：
- 乳脂、無脂乳固形物（MSNF）、糖分、其他固形物對 gelato 質地、綿密度與融化速度的影響
- POD（相對蔗糖的甜度）與 PAC（相對蔗糖的抗凍力）如何決定成品硬度與展示櫃出杯溫度
- 蔗糖、右旋糖、轉化糖、葡萄糖漿等糖類，以及蛋黃、穩定劑、鮮奶油、脫脂奶粉的取捨
- 開心果醬、巧克力、水果泥等風味食材如何改變脂肪與固形物平衡

使用者會給你一份已經用「三元一次方程式平衡基底乳製品」算好的 gelato 配方。請務必：
- 以繁體中文、專業但好懂的口吻回答
- 根據實際數字推理（例如「每 1000g PAC 偏低，冰點偏高，成品在 -14°C 會偏硬難挖」），不要空泛
- 「酸度」欄位：純乳製品基底通常酸度低，說明乳酸感／新鮮度即可；若含水果泥等酸性風味食材再據此判斷
- 「質地與抗凍力」欄位：依脂肪%、MSNF%、總固形物、每 1000g PAC 一起判斷綿密度、硬度、冰晶與砂感風險
- 優化建議要具體可執行，寫清楚加減哪個原料、大概多少`

function n(v: number, digits = 1): string {
  return v.toFixed(digits)
}

export function buildGelatoAnalysisPrompt(recipe: SavedGelatoRecipe): string {
  const { name, inputs, result } = recipe
  const lines: string[] = []

  lines.push(`# 配方名稱：${name}`)
  const note = (recipe.note ?? '').trim()
  if (note) {
    lines.push('')
    lines.push('## 製作者備註')
    lines.push(note)
  }

  lines.push('')
  lines.push('## STEP 1 目標設定')
  lines.push(`- 最終總重量：${n(inputs.totalWeightG, 0)} g`)
  lines.push(`- 脂肪 Fat 目標：${n(inputs.fatTargetPct)}%（三元一次方程式精確命中）`)
  lines.push(`- 無脂乳固形物 MSNF 目標：${n(inputs.msnfTargetPct)}%（精確命中）`)
  lines.push(`- 蔗糖（固定加入）：${n(inputs.sucrosePct)}%`)
  lines.push(`- 穩定劑（固定加入）：${n(inputs.stabilizerPct)}%`)
  if (inputs.eggYolkPct > 0) lines.push(`- 蛋黃（固定加入）：${n(inputs.eggYolkPct)}%`)

  lines.push('')
  lines.push('## 最終配方組成')
  for (const c of result.components) {
    if (Math.abs(c.weightG) < 0.05) continue
    lines.push(`- ${c.name}：${n(c.weightG)} g（${n(c.pctOfTotal, 2)}%）`)
  }

  lines.push('')
  lines.push('## 水份與固形物（依最終配方重算）')
  const b = result.breakdown
  lines.push(`- 水分：${n(b.waterG)} g（${n(b.waterPct)}%）`)
  lines.push(`- 糖分：${n(b.sugarG)} g（${n(b.sugarPct)}%）`)
  lines.push(`- 其他固形物：${n(b.otherSolidsG)} g（${n(b.otherSolidsPct)}%）`)
  lines.push(`- 總固形物：${n(b.totalSolidsG)} g（${n(b.totalSolidsPct)}%）`)
  lines.push(`- 脂肪：${n(inputs.fatTargetPct)}%　MSNF：${n(inputs.msnfTargetPct)}%（折入總固形物）`)

  lines.push('')
  lines.push('## 甜度與抗凍力（POD／PAC，蔗糖 = 1.00）')
  lines.push(`- 總 POD：${n(result.podTotal)}　總 PAC：${n(result.pacTotal)}`)
  lines.push(
    `- 每 1000g POD：${n(result.podPer1000g)}　每 1000g PAC：${n(result.pacPer1000g)}（配方比例不變時的強度標準值）`
  )
  const storage = estimateStorageTemp(result.pacPer1000g)
  lines.push(`- 依抗凍力對照表，建議儲存溫度約 ${formatStorageTemp(storage)}（每 1000g PAC 落在 ${storage.band}）`)

  lines.push('')
  lines.push('## Gelato 建議區間（供對照）')
  lines.push(
    `- 糖分 ${STEP0_RANGES.sugar.min}–${STEP0_RANGES.sugar.max}%、脂肪 ${STEP0_RANGES.fat.min}–${STEP0_RANGES.fat.max}%、` +
      `MSNF ${STEP0_RANGES.msnf.min}–${STEP0_RANGES.msnf.max}%、其他固形物 ${STEP0_RANGES.otherSolids.min}–${STEP0_RANGES.otherSolids.max}%、` +
      `總固形物 ${STEP0_RANGES.totalSolids.min}–${STEP0_RANGES.totalSolids.max}%、有感糖 ${STEP0_RANGES.perceivedSugar.min}–${STEP0_RANGES.perceivedSugar.max}%`
  )

  lines.push('')
  lines.push(
    '請根據以上資料，分析這份 gelato 的整體風味、甜度平衡、質地與抗凍力表現、乳製品基底是否協調，指出配方風險，並給出具體優化建議、風味搭配與變化版本，最後寫一段菜單描述。'
  )

  return lines.join('\n')
}

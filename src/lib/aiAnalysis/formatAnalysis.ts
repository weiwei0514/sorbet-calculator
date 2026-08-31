import type { RecipeAiAnalysis } from '@/lib/calculator/types'

/** Renders a stored analysis back into the plain-text shape the model originally
 *  produced it in — used to seed the assistant's first turn when the user asks
 *  follow-up questions about the analysis. */
export function formatAnalysisAsText(a: RecipeAiAnalysis): string {
  const bullets = (items: string[]) => items.map((x) => `- ${x}`).join('\n')
  return [
    `【整體風味輪廓】\n${a.flavorProfile}`,
    `【甜度平衡】\n${a.sweetness}`,
    `【酸度預估】\n${a.acidity}`,
    `【質地與抗凍力】\n${a.texture}`,
    `【建議上桌溫度】\n${a.servingTemp}`,
    `【配方風險提醒】\n${bullets(a.risks)}`,
    `【優化建議】\n${bullets(a.optimizations)}`,
    `【風味搭配建議】\n${bullets(a.pairings)}`,
    `【變化版本】\n${bullets(a.variations)}`,
    `【菜單描述】\n${a.menuDescription}`,
  ].join('\n\n')
}

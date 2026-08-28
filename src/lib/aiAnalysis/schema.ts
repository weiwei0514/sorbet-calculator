import * as z from 'zod/v4'

/** The exact shape we ask the model to return. `RecipeAiAnalysis` in
 *  calculator/types.ts is this plus `generatedAt`/`model` stamped by the route.
 *  Kept as plain `.describe()` strings (no `.optional()`) so structured output
 *  stays strict — every field is always present. */
export const recipeAiAnalysisSchema = z.object({
  flavorProfile: z
    .string()
    .describe('整體風味輪廓：主導風味、果味濃度、香氣、尾韻、酒體厚薄，2-4 句繁體中文。'),
  sweetness: z
    .string()
    .describe(
      '甜度平衡判讀：依糖分比例與每 1000g POD，判斷入口會偏甜、平衡還是寡淡，並和 sorbet 常見糖分區間（約 26-30%）比較。'
    ),
  acidity: z
    .string()
    .describe('酸度預估：依所用水果種類判斷酸度高低與尖銳感，是否需要補檸檬酸或用糖／轉化糖平衡。'),
  texture: z
    .string()
    .describe(
      '質地與抗凍力：依總固形物與每 1000g PAC，判斷硬度、挖取難度、冰晶／結晶風險，以及是否過軟不成形。'
    ),
  servingTemp: z
    .string()
    .describe('建議上桌溫度範圍（例如 -12°C ~ -14°C）並簡述理由，一句話。'),
  risks: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe('配方風險提醒，每條一句，2-4 條（例如高含水量水果比例偏高造成冰渣、固形物不足易結晶）。'),
  optimizations: z
    .array(z.string())
    .min(3)
    .max(6)
    .describe('具體優化建議，含調整方向與大致幅度，3-5 條（例如「砂糖 -15g、改用轉化糖 20g 以壓低冰點」）。'),
  pairings: z
    .array(z.string())
    .min(2)
    .max(5)
    .describe('風味搭配建議：香草、香料、柑橘皮、香草莢、利口酒等，2-4 條。'),
  variations: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe('變化版本建議，2-3 條（例如加第二種水果、做成 granita、加酒版本）。'),
  menuDescription: z.string().describe('一段給客人看的繁體中文菜單風味描述，1-2 句，帶點畫面感。'),
})

export type RecipeAiAnalysisFields = z.infer<typeof recipeAiAnalysisSchema>

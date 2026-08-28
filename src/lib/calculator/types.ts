export type IngredientCategory = 'fruit' | 'other_sugar' | string

/** Shared by the ingredient form's category dropdown and the database's filter tabs.
 *  Only 'fruit'/'other_sugar' are wired into the Sorbet calculator's dropdowns today —
 *  the rest are shared-database-only, laid in ahead of a future Gelato mode. */
export const INGREDIENT_CATEGORIES = [
  { value: 'fruit', label: '水果' },
  { value: 'other_sugar', label: '其他糖類' },
  { value: 'chocolate', label: '巧克力' },
  { value: 'nut_paste', label: '堅果醬' },
  { value: 'alcohol', label: '酒' },
  { value: 'other', label: '其他' },
] as const satisfies readonly { value: string; label: string }[]

export interface Ingredient {
  id: string
  name: string
  category: IngredientCategory
  waterPct: number
  sugarPct: number
  /** 油脂 — required (defaults to 0). Fruit/sugar entries are legitimately 0;
   *  meaningful for dairy/chocolate/nut-paste style ingredients (附表1 reference table). */
  fatPct: number
  /** 無脂固形物 — required (defaults to 0), same reasoning as fatPct. */
  nonFatSolidsPct: number
  otherSolidsPct: number
  totalSolidsPct: number
  /** Reference-book suggested fruit% range for this ingredient in a sorbet recipe.
   *  Informational only — the 25–60% hard limit in validate.ts is unaffected. Null when unknown. */
  recommendedMinPct: number | null
  recommendedMaxPct: number | null
  /** Sweetness (POD) and anti-freeze (PAC) coefficients, relative to sucrose = 1.00.
   *  Stored as plain decimals (0.45, not 45) — never divide by 100. Null when not yet measured/entered. */
  podCoefficient: number | null
  pacCoefficient: number | null
}

export type IngredientInput = Pick<
  Ingredient,
  | 'name'
  | 'category'
  | 'waterPct'
  | 'sugarPct'
  | 'fatPct'
  | 'nonFatSolidsPct'
  | 'otherSolidsPct'
  | 'recommendedMinPct'
  | 'recommendedMaxPct'
  | 'podCoefficient'
  | 'pacCoefficient'
>

/** Composition of any component, expressed per 100 units of its own weight. */
export interface CompositionPct {
  waterPct: number
  sugarPct: number
  fatPct: number
  nonFatSolidsPct: number
  otherSolidsPct: number
}

/** A fixed, non-database "synthetic" ingredient (sucrose, stabilizer/gel). */
export interface SyntheticComponentConfig extends CompositionPct {
  key: string
  label: string
  podCoefficient: number
  pacCoefficient: number
}

export interface IngredientAmount {
  ingredientId: string
  pct: number
}

export interface RecipeInputs {
  totalWeightG: number
  /** One or more fruits — the 25–60% hard limit applies to their SUM, not each row individually. */
  fruits: IngredientAmount[]
  targetTotalSolidsPct: number
  stabilizerPct: number
  /** One or more "other sugar" ingredients — the 1–5% hard limit applies to their SUM. */
  otherSugars: IngredientAmount[]
  /** Optional "其他" ingredients — 辛香料、茶粉 等，通常只佔配方的一點點。可為空。
   *  用量由使用者指定（同 otherSugars 的處理方式），其固形物會計入總固形物、糖分會計入 POD/PAC。 */
  others: IngredientAmount[]
  /** Optional POD/PAC targets for the reverse-adjustment hint. Null = not set, hide the gap section. */
  targetPOD: number | null
  targetPAC: number | null
}

/** One row of the "自動計算配方" breakdown table. `key` is unique per row (e.g. multiple
 *  fruits each get their own key); `category` is what identity/color/filtering keys off. */
export interface ComponentBreakdown {
  key: string
  category: 'fruit' | 'otherSugar' | 'other' | 'stabilizer' | 'sucrose' | 'water'
  label: string
  weightG: number
  waterG: number
  sugarG: number
  otherSolidsG: number
  totalSolidsG: number
  pctOfTotalWeight: number
  /** null when the underlying ingredient has no coefficient set yet (treated as 0 in totals). */
  podCoefficient: number | null
  pacCoefficient: number | null
  podContributionG: number
  pacContributionG: number
}

export interface RecipeTotals {
  weightG: number
  waterG: number
  sugarG: number
  otherSolidsG: number
  totalSolidsG: number
  waterPct: number
  sugarPct: number
  otherSolidsPct: number
  totalSolidsPct: number
  /** Scales with totalWeightG — doubling the batch at the same proportions doubles this. */
  totalPOD: number
  totalPAC: number
  /** totalPOD ÷ totalWeightG × 1000 — the batch-size-independent "強度" value. Stays
   *  constant when the recipe is scaled up/down at the same proportions, even though
   *  totalPOD/totalPAC themselves scale with totalWeightG. */
  podPer1000g: number
  pacPer1000g: number
}

export interface TargetVsActual {
  target: number
  actual: number
  deltaPct: number
}

/** Distinct from TargetVsActual: gap = target - actual (positive = need to add more),
 *  matching the spec's own worked example ("目前13.5/目標15/差距+1.5"), not actual-target. */
export interface PodPacTarget {
  target: number
  actual: number
  gap: number
}

export interface RecipeResult {
  inputs: RecipeInputs
  components: ComponentBreakdown[]
  totals: RecipeTotals
  comparison: {
    totalSolidsPct: TargetVsActual
    fruitPct: TargetVsActual
    otherSugarPct: TargetVsActual
    /** 「其他」比例。舊的已儲存配方快照沒有這個欄位 — 顯示端需自行判斷是否為 undefined。 */
    otherPct: TargetVsActual
    stabilizerPct: TargetVsActual
  }
  podTarget: PodPacTarget | null
  pacTarget: PodPacTarget | null
  /** Names of ingredients used in this recipe that are missing a POD or PAC coefficient —
   *  their contribution is counted as 0, so totals may be incomplete. Surfaced as a UI notice. */
  missingCoefficientIngredientNames: string[]
  /** Reserved for future 抗凍力/甜度/MSNF/酸度 metrics beyond POD/PAC. Always present, empty in v1. */
  extraMetrics: Record<string, number>
}

export interface ValidationError {
  field: string
  code: string
  message: string
}

/** LLM-generated flavour + optimisation read of a saved recipe. Cached on the
 *  saved_recipes row (see migration 0005) because a saved recipe is frozen — the
 *  analysis only changes when the user explicitly asks to re-run it. The first
 *  ten fields come straight from the model (schema in src/lib/aiAnalysis/schema.ts);
 *  `generatedAt`/`model` are stamped by the API route. */
export interface RecipeAiAnalysis {
  /** 整體風味輪廓 */
  flavorProfile: string
  /** 甜度平衡判讀 */
  sweetness: string
  /** 酸度預估 */
  acidity: string
  /** 質地與抗凍力／硬度評估 */
  texture: string
  /** 建議上桌溫度 */
  servingTemp: string
  /** 配方風險提醒 */
  risks: string[]
  /** 具體優化建議 */
  optimizations: string[]
  /** 風味搭配建議 */
  pairings: string[]
  /** 變化版本建議 */
  variations: string[]
  /** 一段給客人看的菜單描述 */
  menuDescription: string
  generatedAt: string
  model: string
}

/** A named, frozen snapshot of a computed recipe ("儲存配方"). `inputs`/`result` are the
 *  exact RecipeInputs/RecipeResult at save time — not ingredient ids — so the saved
 *  numbers never drift if the underlying ingredient data is edited or deleted later. */
export interface SavedRecipe {
  id: string
  name: string
  inputs: RecipeInputs
  result: RecipeResult
  /** Cached AI 風味分析; null until the user runs it on the 已儲存配方 page. */
  aiAnalysis: RecipeAiAnalysis | null
  createdAt: string
}

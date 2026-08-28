import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import type { RecipeAiAnalysis, SavedRecipe } from '@/lib/calculator/types'
import { recipeAiAnalysisSchema } from '@/lib/aiAnalysis/schema'
import { RECIPE_ANALYSIS_SYSTEM, buildRecipeAnalysisPrompt } from '@/lib/aiAnalysis/buildPrompt'
import { createClient } from '@/lib/supabase/server'
import { saveRecipeAiAnalysis } from '@/lib/savedRecipes/mutations'

export const maxDuration = 300

const MODEL = 'claude-opus-5'

interface AnalyzeRequestBody {
  /** Saved-recipe id — when present the result is also cached onto the row. */
  id?: string
  recipe?: SavedRecipe
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: '尚未設定 ANTHROPIC_API_KEY，無法使用 AI 分析。' }, { status: 500 })
  }

  let body: AnalyzeRequestBody
  try {
    body = (await request.json()) as AnalyzeRequestBody
  } catch {
    return Response.json({ error: '請求格式錯誤。' }, { status: 400 })
  }

  const { id, recipe } = body
  if (!recipe || !recipe.result || !recipe.inputs) {
    return Response.json({ error: '缺少配方資料。' }, { status: 400 })
  }

  let fields: RecipeAiAnalysis | null = null
  try {
    const client = new Anthropic()
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      system: RECIPE_ANALYSIS_SYSTEM,
      output_config: {
        effort: 'medium',
        format: zodOutputFormat(recipeAiAnalysisSchema),
      },
      messages: [{ role: 'user', content: buildRecipeAnalysisPrompt(recipe) }],
    })
    const parsed = response.parsed_output
    if (!parsed) {
      return Response.json({ error: 'AI 回應無法解析成預期格式，請再試一次。' }, { status: 502 })
    }
    fields = { ...parsed, generatedAt: new Date().toISOString(), model: MODEL }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('AI analyze-recipe error:', msg)
    return Response.json({ error: `分析失敗：${msg}` }, { status: 500 })
  }

  // Best-effort cache — a persistence failure shouldn't lose the analysis the user just paid for.
  if (id) {
    try {
      const supabase = await createClient()
      await saveRecipeAiAnalysis(supabase, id, fields)
    } catch (err) {
      console.error('AI analyze-recipe: failed to cache analysis', err)
    }
  }

  return Response.json({ analysis: fields })
}

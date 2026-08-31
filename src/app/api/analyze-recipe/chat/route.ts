import Anthropic from '@anthropic-ai/sdk'
import type { RecipeAiAnalysis, SavedRecipe } from '@/lib/calculator/types'
import { RECIPE_ANALYSIS_SYSTEM, buildRecipeAnalysisPrompt } from '@/lib/aiAnalysis/buildPrompt'
import { formatAnalysisAsText } from '@/lib/aiAnalysis/formatAnalysis'
import { MAX_CHAT_MESSAGE_CHARS, MAX_CHAT_TURNS, type AnalysisChatTurn } from '@/lib/aiAnalysis/chat'
import { createClient } from '@/lib/supabase/server'
import { saveRecipeAiAnalysis } from '@/lib/savedRecipes/mutations'

export const maxDuration = 120

const MODEL = 'claude-opus-5'

const CHAT_SYSTEM = `${RECIPE_ANALYSIS_SYSTEM}

使用者已經看過你針對這份 sorbet 配方做的完整分析，現在要針對分析結果追問。
- 直接回答問題，繁體中文，語氣與先前一致
- 可以引用配方數字與先前分析的內容，但不要每次都重講整份分析
- 需要時給具體做法（加減哪個原料、大概多少）
- 問題超出這份配方範圍時，如實說明
- 回答精簡，聚焦在被問到的點；除非使用者要求，否則控制在約 250 字內
- 以純文字回答，不要使用 Markdown 語法（不要 #、**、表格）；要列點時每點以「・」開頭`

interface ChatRequestBody {
  recipe?: SavedRecipe
  analysis?: RecipeAiAnalysis
  history?: AnalysisChatTurn[]
}

function isValidTurn(t: unknown): t is AnalysisChatTurn {
  return (
    !!t &&
    typeof t === 'object' &&
    ((t as AnalysisChatTurn).role === 'user' || (t as AnalysisChatTurn).role === 'assistant') &&
    typeof (t as AnalysisChatTurn).content === 'string' &&
    (t as AnalysisChatTurn).content.trim().length > 0 &&
    (t as AnalysisChatTurn).content.length <= MAX_CHAT_MESSAGE_CHARS
  )
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: '尚未設定 ANTHROPIC_API_KEY，無法使用 AI 分析。' }, { status: 500 })
  }

  let body: ChatRequestBody
  try {
    body = (await request.json()) as ChatRequestBody
  } catch {
    return Response.json({ error: '請求格式錯誤。' }, { status: 400 })
  }

  const { recipe, analysis, history } = body
  if (!recipe?.result || !recipe.inputs || !analysis) {
    return Response.json({ error: '缺少配方或分析資料。' }, { status: 400 })
  }
  if (!Array.isArray(history) || history.length === 0 || !history.every(isValidTurn)) {
    return Response.json({ error: '提問內容格式不正確。' }, { status: 400 })
  }
  if (history.length > MAX_CHAT_TURNS) {
    return Response.json({ error: '這串對話太長了，請重新分析後再追問。' }, { status: 400 })
  }
  if (history[history.length - 1].role !== 'user') {
    return Response.json({ error: '最後一則訊息必須是使用者提問。' }, { status: 400 })
  }

  const messages = [
    { role: 'user' as const, content: `${buildRecipeAnalysisPrompt(recipe)}\n\n---\n請針對這份配方做完整分析。` },
    { role: 'assistant' as const, content: formatAnalysisAsText(analysis) },
    ...history.map((t) => ({ role: t.role, content: t.content })),
  ]

  try {
    const client = new Anthropic()
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: CHAT_SYSTEM,
      output_config: { effort: 'low' },
      messages,
    })
    const reply = response.content
      .flatMap((b) => (b.type === 'text' ? [b.text] : []))
      .join('\n')
      .trim()
    if (!reply) {
      return Response.json({ error: 'AI 沒有回覆內容，請再試一次。' }, { status: 502 })
    }

    const conversation: AnalysisChatTurn[] = [...history, { role: 'assistant', content: reply }]

    // Persist the thread onto the saved recipe's ai_analysis. Best-effort — a
    // write failure still returns the reply the user just paid for.
    if (recipe.id) {
      try {
        const supabase = await createClient()
        await saveRecipeAiAnalysis(supabase, recipe.id, { ...analysis, conversation })
      } catch (err) {
        console.error('AI analyze-recipe chat: failed to persist conversation', err)
      }
    }

    return Response.json({ reply, conversation })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('AI analyze-recipe chat error:', msg)
    return Response.json({ error: `追問失敗：${msg}` }, { status: 500 })
  }
}

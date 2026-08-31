'use client'

import { useState } from 'react'
import type { RecipeAiAnalysis as Analysis, SavedRecipe } from '@/lib/calculator/types'
import { MAX_CHAT_MESSAGE_CHARS, type AnalysisChatTurn } from '@/lib/aiAnalysis/chat'
import { Button } from '@/components/ui/Button'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' })
}

function Prose({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
        {label}
      </span>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
        {text}
      </p>
    </div>
  )
}

function BulletList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
        {label}
      </span>
      <ul className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
            <span aria-hidden style={{ color: 'var(--accent)' }}>
              —
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FollowUpChat({ recipe, analysis }: { recipe: SavedRecipe; analysis: Analysis }) {
  const [turns, setTurns] = useState<AnalysisChatTurn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    const question = input.trim()
    if (!question || loading) return
    if (question.length > MAX_CHAT_MESSAGE_CHARS) {
      setError(`問題請控制在 ${MAX_CHAT_MESSAGE_CHARS} 字以內。`)
      return
    }
    const history: AnalysisChatTurn[] = [...turns, { role: 'user', content: question }]
    setTurns(history)
    setInput('')
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/analyze-recipe/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe, analysis, history }),
      })
      const data = (await res.json()) as { reply?: string; error?: string }
      if (!res.ok || !data.reply) {
        throw new Error(data.error ?? '追問失敗，請再試一次。')
      }
      setTurns([...history, { role: 'assistant', content: data.reply }])
    } catch (e) {
      // Roll the unanswered question back into the input so it isn't lost.
      setTurns(turns)
      setInput(question)
      setError(e instanceof Error ? e.message : '追問失敗，請再試一次。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 border-t pt-6" style={{ borderColor: 'var(--rule)' }}>
      <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
        追問 AI（針對以上分析）
      </span>

      {turns.length > 0 && (
        <ul className="flex flex-col gap-4">
          {turns.map((t, i) => (
            <li key={i} className="flex flex-col gap-1">
              <span
                className="font-mono-label text-[10px]"
                style={{ color: t.role === 'user' ? 'var(--muted)' : 'var(--accent)' }}
              >
                {t.role === 'user' ? '你' : 'AI'}
              </span>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink)' }}>
                {t.content}
              </p>
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <p className="text-xs" style={{ color: 'var(--faint)' }}>
          AI 思考中…
        </p>
      )}

      {error && (
        <p className="border-l-2 pl-4 text-sm" style={{ borderColor: 'var(--danger)', color: 'var(--muted)' }}>
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          rows={2}
          placeholder="例如：如果我想讓它更酸一點，砂糖要怎麼配合調整？"
          className="w-full resize-y rounded-md border bg-transparent p-3 text-sm outline-none"
          style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px]" style={{ color: 'var(--faint)' }}>
            Enter 送出 · Shift+Enter 換行
          </span>
          <Button variant="outline" onClick={() => void send()} disabled={loading || input.trim().length === 0}>
            {loading ? '送出中…' : '送出'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function RecipeAiAnalysisPanel({
  recipe,
  onAnalyzed,
}: {
  recipe: SavedRecipe
  onAnalyzed: (analysis: Analysis) => void
}) {
  const [analysis, setAnalysis] = useState<Analysis | null>(recipe.aiAnalysis)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recipe.id, recipe }),
      })
      const data = (await res.json()) as { analysis?: Analysis; error?: string }
      if (!res.ok || !data.analysis) {
        throw new Error(data.error ?? '分析失敗，請再試一次。')
      }
      setAnalysis(data.analysis)
      onAnalyzed(data.analysis)
    } catch (e) {
      setError(e instanceof Error ? e.message : '分析失敗，請再試一次。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="font-mono-label text-[10px]" style={{ color: 'var(--accent)' }}>
            AI Flavour Analysis
          </span>
          <span className="font-display text-lg" style={{ color: 'var(--ink)' }}>
            AI 風味分析
          </span>
        </div>
        <Button variant="outline" onClick={run} disabled={loading}>
          {loading ? '分析中…' : analysis ? '重新分析' : '開始分析'}
        </Button>
      </div>

      {loading && (
        <p className="text-xs" style={{ color: 'var(--faint)' }}>
          正在請 Claude 分析這份配方，約需 30–90 秒…
        </p>
      )}

      {error && (
        <p className="border-l-2 pl-4 text-sm" style={{ borderColor: 'var(--danger)', color: 'var(--muted)' }}>
          {error}
        </p>
      )}

      {!analysis && !loading && !error && (
        <p className="text-sm" style={{ color: 'var(--faint)' }}>
          點「開始分析」讓 AI 依配方數字評估整體風味、甜度與酸度平衡、質地與抗凍力，並給出優化建議。
        </p>
      )}

      {analysis && (
        <div className="flex flex-col gap-6">
          <Prose label="整體風味輪廓" text={analysis.flavorProfile} />
          <Prose label="甜度平衡" text={analysis.sweetness} />
          <Prose label="酸度預估" text={analysis.acidity} />
          <Prose label="質地與抗凍力" text={analysis.texture} />
          <Prose label="建議上桌溫度" text={analysis.servingTemp} />
          <BulletList label="配方風險提醒" items={analysis.risks} />
          <BulletList label="優化建議" items={analysis.optimizations} />
          <BulletList label="風味搭配建議" items={analysis.pairings} />
          <BulletList label="變化版本" items={analysis.variations} />
          <Prose label="菜單描述" text={analysis.menuDescription} />
          <p className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
            {formatDate(analysis.generatedAt)} ・ {analysis.model} ・ AI 生成內容僅供參考
          </p>

          {/* Reset the follow-up thread whenever the analysis is (re)generated. */}
          <FollowUpChat key={analysis.generatedAt} recipe={recipe} analysis={analysis} />
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import type { RecipeAiAnalysis, SavedRecipe } from '@/lib/calculator/types'
import { createClient } from '@/lib/supabase/client'
import { extractSupabaseMessage } from '@/lib/supabase/errors'
import { deleteSavedRecipe } from '@/lib/savedRecipes/mutations'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SavedSorbetCard } from './SavedSorbetCard'
import { SavedGelatoCard } from './SavedGelatoCard'

type Tab = 'sorbet' | 'gelato'

export function SavedRecipesList({ initialRecipes }: { initialRecipes: SavedRecipe[] }) {
  const [recipes, setRecipes] = useState<SavedRecipe[]>(initialRecipes)
  const [tab, setTab] = useState<Tab>('sorbet')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<SavedRecipe | null>(null)

  const counts = {
    sorbet: recipes.filter((r) => r.kind === 'sorbet').length,
    gelato: recipes.filter((r) => r.kind === 'gelato').length,
  }
  const visible = recipes.filter((r) => r.kind === tab)

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function patchRecipe(id: string, patch: Partial<SavedRecipe>) {
    setRecipes((prev) => prev.map((r) => (r.id === id ? ({ ...r, ...patch } as SavedRecipe) : r)))
  }

  function handleAnalyzed(id: string, analysis: RecipeAiAnalysis) {
    patchRecipe(id, { aiAnalysis: analysis })
  }

  function handleNoteSaved(id: string, note: string) {
    patchRecipe(id, { note })
  }

  async function handleDelete(recipe: SavedRecipe) {
    setErrorMessage(null)
    try {
      await deleteSavedRecipe(createClient(), recipe.id)
      setRecipes((prev) => prev.filter((r) => r.id !== recipe.id))
    } catch (e) {
      console.error(e)
      const detail = extractSupabaseMessage(e)
      setErrorMessage(detail ? `刪除失敗：${detail}` : '無法連線到資料庫，請確認 Supabase 設定是否正確。')
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <ConfirmDialog
        open={pendingDelete != null}
        title="刪除配方"
        message={pendingDelete ? `確定要刪除「${pendingDelete.name}」嗎？此操作無法復原。` : ''}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) handleDelete(pendingDelete)
          setPendingDelete(null)
        }}
      />

      <div className="flex gap-6 border-b" style={{ borderColor: 'var(--rule)' }}>
        {(['sorbet', 'gelato'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="font-mono-label -mb-px flex min-h-11 items-center gap-2 border-b-2 text-sm"
            style={{
              borderColor: tab === t ? 'var(--accent)' : 'transparent',
              color: tab === t ? 'var(--accent)' : 'var(--faint)',
            }}
          >
            {t === 'sorbet' ? 'SORBET' : 'GELATO'}
            <span className="tabular text-[10px]">{counts[t]}</span>
          </button>
        ))}
      </div>

      {errorMessage && (
        <p className="border-l-2 pl-6 text-sm" style={{ borderColor: 'var(--danger)', color: 'var(--muted)' }}>
          {errorMessage}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--faint)' }}>
          {tab === 'sorbet'
            ? '還沒有儲存任何 Sorbet 配方。到「計算機」算出配方後，點「儲存配方」即可存到這裡。'
            : '還沒有儲存任何 Gelato 配方。到「計算機」切換到 GELATO、按「重新計算」得到可行配方後即可儲存。'}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {visible.map((recipe) =>
            recipe.kind === 'gelato' ? (
              <SavedGelatoCard
                key={recipe.id}
                recipe={recipe}
                expanded={expandedIds.has(recipe.id)}
                onToggle={() => toggleExpanded(recipe.id)}
                onDelete={() => setPendingDelete(recipe)}
                onNoteSaved={(note) => handleNoteSaved(recipe.id, note)}
              />
            ) : (
              <SavedSorbetCard
                key={recipe.id}
                recipe={recipe}
                expanded={expandedIds.has(recipe.id)}
                onToggle={() => toggleExpanded(recipe.id)}
                onDelete={() => setPendingDelete(recipe)}
                onNoteSaved={(note) => handleNoteSaved(recipe.id, note)}
                onAnalyzed={(analysis) => handleAnalyzed(recipe.id, analysis)}
              />
            )
          )}
        </ul>
      )}
    </div>
  )
}

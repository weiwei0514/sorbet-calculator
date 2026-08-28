'use client'

import { useState } from 'react'
import type { RecipeAiAnalysis, SavedRecipe } from '@/lib/calculator/types'
import { createClient } from '@/lib/supabase/client'
import { extractSupabaseMessage } from '@/lib/supabase/errors'
import { deleteSavedRecipe } from '@/lib/savedRecipes/mutations'
import { estimateStorageTemp, formatStorageTemp } from '@/lib/calculator/storageTemp'
import { ComputedRecipeTable } from '@/components/calculator/ComputedRecipeTable'
import { RecipeAnalysisTable } from '@/components/calculator/RecipeAnalysisTable'
import { RecipeAiAnalysisPanel } from '@/components/saved/RecipeAiAnalysis'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

function fmt(n: number, digits = 1) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

function shortLabel(label: string) {
  return label.replace(/^水果：|^其他糖類：|^其他：/, '')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' })
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0"
      style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PodPacSummary({ recipe }: { recipe: SavedRecipe }) {
  const { totals, podTarget, pacTarget, missingCoefficientIngredientNames } = recipe.result
  const storage = estimateStorageTemp(totals.pacPer1000g)
  return (
    <div className="flex flex-col gap-5">
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      <div className="flex flex-col gap-1">
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          總 POD
        </span>
        <span className="tabular text-lg" style={{ color: 'var(--ink)' }}>
          {fmt(totals.totalPOD)}
        </span>
        {podTarget && (
          <span className="text-xs" style={{ color: 'var(--faint)' }}>
            目標 {fmt(podTarget.target)}（差距 {fmt(podTarget.gap)}）
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          總 PAC
        </span>
        <span className="tabular text-lg" style={{ color: 'var(--ink)' }}>
          {fmt(totals.totalPAC)}
        </span>
        {pacTarget && (
          <span className="text-xs" style={{ color: 'var(--faint)' }}>
            目標 {fmt(pacTarget.target)}（差距 {fmt(pacTarget.gap)}）
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          每 1000g POD
        </span>
        <span className="tabular text-lg" style={{ color: 'var(--ink)' }}>
          {fmt(totals.podPer1000g)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          每 1000g PAC
        </span>
        <span className="tabular text-lg" style={{ color: 'var(--ink)' }}>
          {fmt(totals.pacPer1000g)}
        </span>
      </div>
    </div>

      <div
        className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-l-2 pl-4"
        style={{ borderColor: 'var(--accent)' }}
      >
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          建議儲存溫度
        </span>
        <span className="tabular text-lg" style={{ color: 'var(--ink)' }}>
          {formatStorageTemp(storage)}
        </span>
        <span className="text-xs" style={{ color: 'var(--faint)' }}>
          參考表 {storage.band}
          {missingCoefficientIngredientNames.length > 0 && ' ・ PAC 可能不完整，僅供參考'}
        </span>
      </div>
    </div>
  )
}

export function SavedRecipesList({ initialRecipes }: { initialRecipes: SavedRecipe[] }) {
  const [recipes, setRecipes] = useState<SavedRecipe[]>(initialRecipes)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<SavedRecipe | null>(null)

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleAnalyzed(id: string, analysis: RecipeAiAnalysis) {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, aiAnalysis: analysis } : r)))
  }

  async function handleDelete(recipe: SavedRecipe) {
    setErrorMessage(null)
    try {
      const supabase = createClient()
      await deleteSavedRecipe(supabase, recipe.id)
      setRecipes((prev) => prev.filter((r) => r.id !== recipe.id))
    } catch (e) {
      console.error(e)
      const detail = extractSupabaseMessage(e)
      setErrorMessage(detail ? `刪除失敗：${detail}` : '無法連線到資料庫，請確認 Supabase 設定是否正確。')
    }
  }

  if (recipes.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--faint)' }}>
        還沒有儲存任何配方。到「計算機」算出配方後，點「儲存配方」即可存到這裡。
      </p>
    )
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

      {errorMessage && (
        <p className="border-l-2 pl-6 text-sm" style={{ borderColor: 'var(--danger)', color: 'var(--muted)' }}>
          {errorMessage}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {recipes.map((recipe) => {
          const expanded = expandedIds.has(recipe.id)
          const fruitNames = recipe.result.components
            .filter((c) => c.category === 'fruit')
            .map((c) => shortLabel(c.label))
            .join('、')

          return (
            <li
              key={recipe.id}
              className="overflow-hidden rounded-lg border"
              style={{
                borderColor: expanded ? 'var(--accent)' : 'var(--rule)',
                background: expanded ? 'color-mix(in oklab, var(--accent) 6%, transparent)' : 'transparent',
              }}
            >
              <button
                onClick={() => toggleExpanded(recipe.id)}
                aria-expanded={expanded}
                className="flex w-full flex-col gap-2 p-5 text-left active:opacity-70"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-display text-xl">{recipe.name}</span>
                  <span style={{ color: 'var(--faint)' }}>
                    <Chevron expanded={expanded} />
                  </span>
                </div>
                <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
                  {formatDate(recipe.createdAt)}
                </span>
                <span className="tabular text-sm" style={{ color: 'var(--muted)' }}>
                  {fmt(recipe.result.totals.weightG, 0)}g ・ {fruitNames} ・ 總固形物 {fmt(recipe.result.totals.totalSolidsPct)}%
                </span>
              </button>

              {expanded && (
                <div className="flex flex-col gap-10 border-t px-5 pt-8 pb-6" style={{ borderColor: 'var(--rule)' }}>
                  <ComputedRecipeTable components={recipe.result.components} totals={recipe.result.totals} />
                  <RecipeAnalysisTable result={recipe.result} />
                  <PodPacSummary recipe={recipe} />
                  <div className="border-t pt-8" style={{ borderColor: 'var(--rule)' }}>
                    <RecipeAiAnalysisPanel
                      recipe={recipe}
                      onAnalyzed={(analysis) => handleAnalyzed(recipe.id, analysis)}
                    />
                  </div>
                  <div>
                    <Button variant="ghost" style={{ color: 'var(--danger)' }} onClick={() => setPendingDelete(recipe)}>
                      刪除此配方
                    </Button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

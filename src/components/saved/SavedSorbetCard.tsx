'use client'

import type { RecipeAiAnalysis, SavedSorbetRecipe } from '@/lib/calculator/types'
import { estimateStorageTemp, formatStorageTemp } from '@/lib/calculator/storageTemp'
import { ComputedRecipeTable } from '@/components/calculator/ComputedRecipeTable'
import { RecipeAnalysisTable } from '@/components/calculator/RecipeAnalysisTable'
import { RecipeAiAnalysisPanel } from '@/components/saved/RecipeAiAnalysis'
import { Button } from '@/components/ui/Button'
import { Chevron, NoteEditor, fmt, formatDate } from './shared'

function shortLabel(label: string) {
  return label.replace(/^水果：|^其他糖類：|^其他：/, '')
}

function PodPacSummary({ recipe }: { recipe: SavedSorbetRecipe }) {
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

export function SavedSorbetCard({
  recipe,
  expanded,
  onToggle,
  onDelete,
  onNoteSaved,
  onAnalyzed,
}: {
  recipe: SavedSorbetRecipe
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  onNoteSaved: (note: string) => void
  onAnalyzed: (analysis: RecipeAiAnalysis) => void
}) {
  const fruitNames = recipe.result.components
    .filter((c) => c.category === 'fruit')
    .map((c) => shortLabel(c.label))
    .join('、')

  return (
    <li
      className="overflow-hidden rounded-lg border"
      style={{
        borderColor: expanded ? 'var(--accent)' : 'var(--rule)',
        background: expanded ? 'color-mix(in oklab, var(--accent) 6%, transparent)' : 'transparent',
      }}
    >
      <button onClick={onToggle} aria-expanded={expanded} className="flex w-full flex-col gap-2 p-5 text-left active:opacity-70">
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
        {recipe.note && !expanded && (
          <span className="font-display line-clamp-2 text-sm italic" style={{ color: 'var(--faint)' }}>
            {recipe.note}
          </span>
        )}
      </button>

      {expanded && (
        <div className="flex flex-col gap-10 border-t px-5 pt-8 pb-6" style={{ borderColor: 'var(--rule)' }}>
          <NoteEditor recipeId={recipe.id} note={recipe.note} onSaved={onNoteSaved} />
          <ComputedRecipeTable components={recipe.result.components} totals={recipe.result.totals} />
          <RecipeAnalysisTable result={recipe.result} />
          <PodPacSummary recipe={recipe} />
          <div className="border-t pt-8" style={{ borderColor: 'var(--rule)' }}>
            <RecipeAiAnalysisPanel recipe={recipe} onAnalyzed={onAnalyzed} />
          </div>
          <div>
            <Button variant="ghost" style={{ color: 'var(--danger)' }} onClick={onDelete}>
              刪除此配方
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}

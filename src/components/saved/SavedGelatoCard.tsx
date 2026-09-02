'use client'

import type { SavedGelatoRecipe } from '@/lib/calculator/types'
import { GelatoAnalysis, GelatoRecipeTable } from '@/components/gelato/GelatoResultView'
import { Button } from '@/components/ui/Button'
import { Chevron, NoteEditor, fmt, formatDate } from './shared'

function StepRangeSummary({ recipe }: { recipe: SavedGelatoRecipe }) {
  const r = recipe.inputs.ranges
  const rows: [string, number, number][] = [
    ['Sugar', r.sugar.min, r.sugar.max],
    ['Fat', r.fat.min, r.fat.max],
    ['MSNF', r.msnf.min, r.msnf.max],
    ['Other Solids', r.otherSolids.min, r.otherSolids.max],
    ['Total Solids', r.totalSolids.min, r.totalSolids.max],
    ['有感糖', r.perceivedSugar.min, r.perceivedSugar.max],
  ]
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
        Step 0 · 儲存時的允許範圍
      </span>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs" style={{ color: 'var(--muted)' }}>
        {rows.map(([label, lo, hi]) => (
          <span key={label} className="tabular">
            {label} {lo}–{hi}%
          </span>
        ))}
        {r.pac && (
          <span className="tabular">
            PAC {r.pac.min}–{r.pac.max}
          </span>
        )}
      </div>
    </div>
  )
}

export function SavedGelatoCard({
  recipe,
  expanded,
  onToggle,
  onDelete,
  onNoteSaved,
}: {
  recipe: SavedGelatoRecipe
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  onNoteSaved: (note: string) => void
}) {
  const snap = recipe.result
  const anyOut = snap.metrics.some((m) => m.range != null && !m.inRange)

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
          {fmt(snap.totalWeightG, 0)}g ・ 總固形物{' '}
          {fmt(snap.metrics.find((m) => m.key === 'totalSolids')?.value ?? 0)}% ・ 脂肪{' '}
          {fmt(snap.metrics.find((m) => m.key === 'fat')?.value ?? 0)}%
          {anyOut && <span style={{ color: 'var(--danger)' }}> ・ 有指標超出範圍</span>}
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
          <GelatoRecipeTable recipe={snap} />
          <div>
            <p className="font-mono-label mb-4 text-[10px]" style={{ color: 'var(--faint)' }}>
              Analysis · 配方分析
            </p>
            <GelatoAnalysis recipe={snap} />
          </div>
          <StepRangeSummary recipe={recipe} />
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

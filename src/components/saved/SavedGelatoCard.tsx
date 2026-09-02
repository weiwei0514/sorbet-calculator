'use client'

import type { SavedGelatoRecipe } from '@/lib/calculator/types'
import { GelatoAnalysis, GelatoFormulaCheck, GelatoRecipeTable } from '@/components/gelato/GelatoResultView'
import { Button } from '@/components/ui/Button'
import { Chevron, NoteEditor, fmt, formatDate } from './shared'

function TargetsSummary({ recipe }: { recipe: SavedGelatoRecipe }) {
  const i = recipe.inputs
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
        STEP 1 · 儲存時的目標
      </span>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs tabular" style={{ color: 'var(--muted)' }}>
        <span>Total {fmt(i.totalWeightG, 0)} g</span>
        <span>Fat {i.fatTargetPct}%</span>
        <span>MSNF {i.msnfTargetPct}%</span>
        <span>Sucrose {i.sucrosePct}%</span>
        <span>Stabilizer {i.stabilizerPct}%</span>
        {i.eggYolkPct > 0 && <span>Egg Yolk {i.eggYolkPct}%</span>}
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
  const fat = snap.metrics.find((m) => m.key === 'fat')?.value ?? 0
  const totalSolids = snap.metrics.find((m) => m.key === 'totalSolids')?.value ?? 0

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
          {fmt(snap.totalWeightG, 0)}g ・ 脂肪 {fmt(fat)}% ・ 固形物 {fmt(totalSolids)}%
          {snap.overallPass ? (
            <span style={{ color: 'var(--ok)' }}> ・ ✅ PASS</span>
          ) : (
            <span style={{ color: 'var(--danger)' }}> ・ ❌ FAIL</span>
          )}
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
          <TargetsSummary recipe={recipe} />
          <GelatoRecipeTable recipe={snap} />
          <div>
            <p className="font-mono-label mb-4 text-[10px]" style={{ color: 'var(--faint)' }}>
              Ingredient Analysis · 配方完整分析
            </p>
            <GelatoAnalysis recipe={snap} />
          </div>
          <GelatoFormulaCheck recipe={snap} />
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

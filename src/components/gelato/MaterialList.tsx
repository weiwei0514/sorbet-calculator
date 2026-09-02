'use client'

import type { Ingredient } from '@/lib/calculator/types'
import type { GelatoMaterial } from '@/lib/gelato/types'
import { Button } from '@/components/ui/Button'

/** Shared STEP 2 material list — used for both 風味食材 (2A) and 其他固定食材 (2B).
 *  Each row is a fixed weight (or % of total) the solver never touches. */
export function MaterialList({
  ingredients,
  rows,
  onChange,
  addLabel,
  emptyLabel,
}: {
  ingredients: Ingredient[]
  rows: GelatoMaterial[]
  onChange: (rows: GelatoMaterial[]) => void
  addLabel: string
  emptyLabel: string
}) {
  const update = (i: number, patch: Partial<GelatoMaterial>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const add = () => onChange([...rows, { ingredientId: ingredients[0]?.id ?? '', amount: 50, unit: 'g' }])

  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--faint)' }}>
          {emptyLabel}
        </p>
      )}

      {rows.map((row, i) => (
        <div key={i} className="flex flex-wrap items-end gap-3">
          <select
            value={row.ingredientId}
            onChange={(e) => update(i, { ingredientId: e.target.value })}
            className="min-w-[10rem] flex-[2] border-b bg-transparent pb-1.5 text-base font-medium outline-none"
            style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
          >
            {ingredients.length === 0 && <option value="">資料庫中沒有可選材料</option>}
            {ingredients.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          <div className="flex items-baseline gap-1 border-b pb-1.5" style={{ borderColor: 'var(--rule)' }}>
            <input
              type="number"
              step={row.unit === 'g' ? 5 : 0.5}
              min={0}
              value={row.amount}
              onChange={(e) => update(i, { amount: e.target.valueAsNumber })}
              className="tabular w-24 bg-transparent text-base font-medium outline-none"
              style={{ color: 'var(--ink)' }}
            />
          </div>

          <div className="inline-flex overflow-hidden rounded border" style={{ borderColor: 'var(--rule)' }}>
            {(['g', 'pct'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => update(i, { unit: u })}
                className="font-mono-label px-3 py-1.5 text-[10px]"
                style={{
                  background: row.unit === u ? 'var(--accent)' : 'transparent',
                  color: row.unit === u ? 'var(--on-accent)' : 'var(--muted)',
                }}
              >
                {u === 'g' ? 'g' : '%'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => remove(i)}
            className="font-mono-label min-h-11 shrink-0 text-[10px]"
            style={{ color: 'var(--danger)' }}
          >
            移除
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={add}
        disabled={ingredients.length === 0}
      >
        {addLabel}
      </Button>
    </div>
  )
}

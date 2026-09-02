'use client'

import type { Ingredient } from '@/lib/calculator/types'
import type { FreeMaterial } from '@/lib/gelato/types'
import { Button } from '@/components/ui/Button'

export function FreeMaterialList({
  ingredients,
  rows,
  onChange,
}: {
  ingredients: Ingredient[]
  rows: FreeMaterial[]
  onChange: (rows: FreeMaterial[]) => void
}) {
  const options = ingredients
  const update = (i: number, patch: Partial<FreeMaterial>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const add = () => onChange([...rows, { ingredientId: options[0]?.id ?? '', weightG: 100 }])

  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--faint)' }}>
          自由加入任何食材，直接輸入重量（g）。程式不會更動這些重量。
        </p>
      )}

      {rows.map((row, i) => (
        <div key={i} className="flex items-end gap-3">
          <select
            value={row.ingredientId}
            onChange={(e) => update(i, { ingredientId: e.target.value })}
            className="min-w-0 flex-[2] border-b bg-transparent pb-1.5 text-base font-medium outline-none"
            style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
          >
            {options.length === 0 && <option value="">資料庫中沒有可選材料</option>}
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <div className="flex flex-1 items-baseline gap-1 border-b pb-1.5" style={{ borderColor: 'var(--rule)' }}>
            <input
              type="number"
              step={5}
              min={0}
              value={row.weightG}
              onChange={(e) => update(i, { weightG: e.target.valueAsNumber })}
              className="tabular w-full bg-transparent text-base font-medium outline-none"
              style={{ color: 'var(--ink)' }}
            />
            <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
              g
            </span>
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

      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={add} disabled={options.length === 0}>
        ＋新增食材
      </Button>
    </div>
  )
}

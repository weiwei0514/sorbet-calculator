'use client'

import type { Ingredient } from '@/lib/calculator/types'
import type { Step1Material } from '@/lib/gelato/types'
import { Button } from '@/components/ui/Button'

/** Ingredients offered in the Step 1 dropdowns — everything except the fruit rows,
 *  which belong to the Sorbet flow. Gelato Step 1 is sugars / stabiliser / egg / etc. */
function step1Options(ingredients: Ingredient[]): Ingredient[] {
  return ingredients.filter((i) => i.category !== 'fruit')
}

export function Step1ConstraintList({
  ingredients,
  rows,
  onChange,
}: {
  ingredients: Ingredient[]
  rows: Step1Material[]
  onChange: (rows: Step1Material[]) => void
}) {
  const options = step1Options(ingredients)

  const update = (i: number, patch: Partial<Step1Material>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
  const add = () =>
    onChange([...rows, { ingredientId: options[0]?.id ?? '', use: true, minPct: 0, maxPct: 10 }])

  return (
    <div className="flex flex-col gap-5">
      {rows.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--faint)' }}>
          尚未設定 Step 1 材料。按下方按鈕加入（例如蔗糖、右旋糖、穩定劑、蛋黃）。
        </p>
      )}

      {rows.map((row, i) => (
        <div key={i} className="flex flex-col gap-2 border-l-2 pl-4" style={{ borderColor: 'var(--rule)' }}>
          <div className="flex items-center gap-3">
            <select
              value={row.ingredientId}
              onChange={(e) => update(i, { ingredientId: e.target.value })}
              className="min-w-0 flex-1 border-b bg-transparent pb-1 text-base font-medium outline-none"
              style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
            >
              {options.length === 0 && <option value="">資料庫中沒有可選材料</option>}
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => remove(i)}
              className="font-mono-label shrink-0 text-[10px]"
              style={{ color: 'var(--danger)' }}
            >
              移除
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink)' }}>
              <input type="checkbox" checked={row.use} onChange={(e) => update(i, { use: e.target.checked })} />
              使用
            </label>
            <label className="flex flex-col gap-1" style={{ opacity: row.use ? 1 : 0.4 }}>
              <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
                最低 %
              </span>
              <input
                type="number"
                step={0.1}
                disabled={!row.use}
                value={row.minPct}
                onChange={(e) => update(i, { minPct: e.target.valueAsNumber })}
                className="tabular w-20 border-b bg-transparent pb-1 text-sm outline-none"
                style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
              />
            </label>
            <label className="flex flex-col gap-1" style={{ opacity: row.use ? 1 : 0.4 }}>
              <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
                最高 %
              </span>
              <input
                type="number"
                step={0.1}
                disabled={!row.use}
                value={row.maxPct}
                onChange={(e) => update(i, { maxPct: e.target.valueAsNumber })}
                className="tabular w-20 border-b bg-transparent pb-1 text-sm outline-none"
                style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
              />
            </label>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={add} disabled={options.length === 0}>
        ＋新增 Step 1 材料
      </Button>
    </div>
  )
}

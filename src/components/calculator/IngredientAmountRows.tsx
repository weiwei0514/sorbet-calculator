import type { Ingredient, IngredientAmount } from '@/lib/calculator/types'
import { Button } from '@/components/ui/Button'

interface IngredientAmountRowsProps {
  title: string
  rows: IngredientAmount[]
  options: Ingredient[]
  onChange: (rows: IngredientAmount[]) => void
  addLabel: string
  emptyLabel: string
  rangeMin: number
  rangeMax: number
  rangeUnitLabel: string
  newRowDefaultPct: number
  showRecommendedHint?: boolean
}

function fmt(n: number) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
}

export function IngredientAmountRows({
  title,
  rows,
  options,
  onChange,
  addLabel,
  emptyLabel,
  rangeMin,
  rangeMax,
  rangeUnitLabel,
  newRowDefaultPct,
  showRecommendedHint = false,
}: IngredientAmountRowsProps) {
  const total = rows.reduce((sum, r) => sum + r.pct, 0)
  const isOutOfRange = total < rangeMin || total > rangeMax

  function updateRow(index: number, patch: Partial<IngredientAmount>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index))
  }

  function addRow() {
    onChange([...rows, { ingredientId: options[0]?.id ?? '', pct: newRowDefaultPct }])
  }

  return (
    <div className="flex flex-col gap-4 sm:col-span-2">
      <div className="flex items-baseline justify-between">
        <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
          {title}
        </span>
        <span className="tabular text-xs" style={{ color: isOutOfRange ? 'var(--danger)' : 'var(--faint)' }}>
          {rangeUnitLabel}：{fmt(total)}%（範圍 {rangeMin}%~{rangeMax}%）
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {rows.map((row, i) => {
          const selected = options.find((o) => o.id === row.ingredientId)
          const hasRecommendedRange =
            showRecommendedHint && selected?.recommendedMinPct != null && selected?.recommendedMaxPct != null

          return (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-end gap-3">
                <div className="min-w-0 flex-[2] border-b pb-1.5" style={{ borderColor: 'var(--rule)' }}>
                  <select
                    value={row.ingredientId}
                    onChange={(e) => updateRow(i, { ingredientId: e.target.value })}
                    className="w-full bg-transparent text-base font-medium outline-none"
                    style={{ color: 'var(--ink)' }}
                  >
                    {options.length === 0 && <option value="">{emptyLabel}</option>}
                    {options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-1 items-baseline gap-1 border-b pb-1.5" style={{ borderColor: 'var(--rule)' }}>
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    value={row.pct}
                    onChange={(e) => updateRow(i, { pct: e.target.valueAsNumber })}
                    className="tabular w-full bg-transparent text-base font-medium outline-none"
                    style={{ color: 'var(--ink)' }}
                  />
                  <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
                    %
                  </span>
                </div>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="font-mono-label min-h-11 shrink-0 text-[10px]"
                    style={{ color: 'var(--danger)' }}
                  >
                    移除
                  </button>
                )}
              </div>
              {hasRecommendedRange && (
                <span className="text-xs" style={{ color: 'var(--accent)' }}>
                  參考書建議：{selected!.recommendedMinPct}%–{selected!.recommendedMaxPct}%
                </span>
              )}
            </div>
          )
        })}
      </div>

      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={addRow}>
        {addLabel}
      </Button>
    </div>
  )
}

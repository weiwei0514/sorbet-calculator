'use client'

import type { Ingredient } from '@/lib/calculator/types'
import type { BaseDairySelection } from '@/lib/gelato/types'

const SLOTS: { key: keyof BaseDairySelection; label: string; hint: string }[] = [
  { key: 'skimPowderId', label: 'X — 脫脂奶粉', hint: '主要提供 MSNF' },
  { key: 'butterId', label: 'Y — 奶油', hint: '主要提供脂肪' },
  { key: 'wholeMilkId', label: 'Z — 全脂牛奶', hint: '主要提供水分' },
]

export function BaseDairyPicker({
  ingredients,
  value,
  onChange,
}: {
  ingredients: Ingredient[]
  value: BaseDairySelection
  onChange: (next: BaseDairySelection) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {SLOTS.map((slot) => (
        <label key={slot.key} className="flex flex-col gap-2">
          <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
            {slot.label}
          </span>
          <select
            value={value[slot.key]}
            onChange={(e) => onChange({ ...value, [slot.key]: e.target.value })}
            className="border-b bg-transparent pb-1.5 text-base font-medium outline-none"
            style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
          >
            <option value="">— 請選擇 —</option>
            {ingredients.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <span className="text-[10px]" style={{ color: 'var(--faint)' }}>
            {slot.hint}
          </span>
        </label>
      ))}
    </div>
  )
}

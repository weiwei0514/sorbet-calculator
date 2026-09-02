'use client'

import type { Ingredient } from '@/lib/calculator/types'
import type { GelatoInputs } from '@/lib/gelato/types'

const SLOTS: { key: 'baseX' | 'baseY' | 'baseZ'; label: string; hint: string }[] = [
  { key: 'baseX', label: 'X — 主要基底 1', hint: '例：全脂牛奶（提供水分）' },
  { key: 'baseY', label: 'Y — 主要基底 2', hint: '例：鮮奶油（提供脂肪）' },
  { key: 'baseZ', label: 'Z — 主要基底 3', hint: '例：脫脂奶粉（提供 MSNF）' },
]

export function BaseTriplePicker({
  ingredients,
  inputs,
  onChange,
}: {
  ingredients: Ingredient[]
  inputs: GelatoInputs
  onChange: (patch: Partial<GelatoInputs>) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {SLOTS.map((slot) => (
        <label key={slot.key} className="flex flex-col gap-2">
          <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
            {slot.label}
          </span>
          <select
            value={inputs[slot.key]}
            onChange={(e) => onChange({ [slot.key]: e.target.value })}
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

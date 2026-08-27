'use client'

import { useState } from 'react'
import type { Ingredient, IngredientCategory, IngredientInput, ValidationError } from '@/lib/calculator/types'
import { validateIngredientComposition } from '@/lib/calculator/validate'
import { Button } from '@/components/ui/Button'

interface IngredientFormProps {
  initial?: Ingredient | null
  onSubmit: (input: IngredientInput) => Promise<void>
  onCancel?: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  fruit: '水果',
  other_sugar: '其他糖類',
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
      {children}
    </span>
  )
}

const inputClass = 'w-full border-b bg-transparent pb-1.5 text-base outline-none'

export function IngredientForm({ initial, onSubmit, onCancel }: IngredientFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<IngredientCategory>(initial?.category ?? 'fruit')
  const [waterPct, setWaterPct] = useState(initial?.waterPct ?? 0)
  const [sugarPct, setSugarPct] = useState(initial?.sugarPct ?? 0)
  const [otherSolidsPct, setOtherSolidsPct] = useState(initial?.otherSolidsPct ?? 0)
  const [recommendedMinPct, setRecommendedMinPct] = useState(initial?.recommendedMinPct?.toString() ?? '')
  const [recommendedMaxPct, setRecommendedMaxPct] = useState(initial?.recommendedMaxPct?.toString() ?? '')
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [submitting, setSubmitting] = useState(false)

  const totalSolidsPct = sugarPct + otherSolidsPct

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: IngredientInput = {
      name,
      category,
      waterPct,
      sugarPct,
      otherSolidsPct,
      recommendedMinPct: recommendedMinPct.trim() === '' ? null : Number(recommendedMinPct),
      recommendedMaxPct: recommendedMaxPct.trim() === '' ? null : Number(recommendedMaxPct),
    }
    const validationErrors = validateIngredientComposition(input)
    if (!name.trim()) {
      validationErrors.push({ field: 'name', code: 'REQUIRED', message: '請輸入食材名稱' })
    }
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors([])
    setSubmitting(true)
    try {
      await onSubmit(input)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 border-l-2 py-2 pl-6"
      style={{ borderColor: 'var(--accent)' }}
    >
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
        <label className="flex flex-col gap-2 sm:col-span-2">
          <FieldLabel>名稱</FieldLabel>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <FieldLabel>分類</FieldLabel>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
            className={inputClass}
          >
            <option value="fruit">{CATEGORY_LABELS.fruit}</option>
            <option value="other_sugar">{CATEGORY_LABELS.other_sugar}</option>
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <FieldLabel>水分 %</FieldLabel>
          <input
            type="number"
            step={0.1}
            value={waterPct}
            onChange={(e) => setWaterPct(e.target.valueAsNumber)}
            style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
            className={`tabular ${inputClass}`}
          />
        </label>

        <label className="flex flex-col gap-2">
          <FieldLabel>糖分 %</FieldLabel>
          <input
            type="number"
            step={0.1}
            value={sugarPct}
            onChange={(e) => setSugarPct(e.target.valueAsNumber)}
            style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
            className={`tabular ${inputClass}`}
          />
        </label>

        <label className="flex flex-col gap-2">
          <FieldLabel>其他固形物 %</FieldLabel>
          <input
            type="number"
            step={0.1}
            value={otherSolidsPct}
            onChange={(e) => setOtherSolidsPct(e.target.valueAsNumber)}
            style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
            className={`tabular ${inputClass}`}
          />
        </label>

        <div className="flex flex-col gap-2">
          <FieldLabel>總固形物 %（自動）</FieldLabel>
          <div className="tabular border-b pb-1.5 text-base" style={{ borderColor: 'var(--rule)', color: 'var(--accent)' }}>
            {totalSolidsPct.toFixed(1)}
          </div>
        </div>

        {category === 'fruit' && (
          <>
            <label className="flex flex-col gap-2">
              <FieldLabel>建議添加比例下限 %（選填）</FieldLabel>
              <input
                type="number"
                step={1}
                value={recommendedMinPct}
                onChange={(e) => setRecommendedMinPct(e.target.value)}
                style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
                className={`tabular ${inputClass}`}
              />
            </label>

            <label className="flex flex-col gap-2">
              <FieldLabel>建議添加比例上限 %（選填）</FieldLabel>
              <input
                type="number"
                step={1}
                value={recommendedMaxPct}
                onChange={(e) => setRecommendedMaxPct(e.target.value)}
                style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
                className={`tabular ${inputClass}`}
              />
            </label>
          </>
        )}
      </div>

      {errors.length > 0 && (
        <ul className="space-y-1 text-sm" style={{ color: 'var(--danger)' }}>
          {errors.map((err, i) => (
            <li key={i}>{err.message}</li>
          ))}
        </ul>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {initial ? '儲存修改' : '新增食材'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            取消
          </Button>
        )}
      </div>
    </form>
  )
}

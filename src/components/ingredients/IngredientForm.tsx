'use client'

import { useState } from 'react'
import type { Ingredient, IngredientCategory, IngredientInput, ValidationError } from '@/lib/calculator/types'
import { validateIngredientComposition } from '@/lib/calculator/validate'

interface IngredientFormProps {
  initial?: Ingredient | null
  onSubmit: (input: IngredientInput) => Promise<void>
  onCancel?: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  fruit: '水果',
  other_sugar: '其他糖類',
}

export function IngredientForm({ initial, onSubmit, onCancel }: IngredientFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<IngredientCategory>(initial?.category ?? 'fruit')
  const [waterPct, setWaterPct] = useState(initial?.waterPct ?? 0)
  const [sugarPct, setSugarPct] = useState(initial?.sugarPct ?? 0)
  const [otherSolidsPct, setOtherSolidsPct] = useState(initial?.otherSolidsPct ?? 0)
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [submitting, setSubmitting] = useState(false)

  const totalSolidsPct = sugarPct + otherSolidsPct

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: IngredientInput = { name, category, waterPct, sugarPct, otherSolidsPct }
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">名稱</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">分類</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="fruit">{CATEGORY_LABELS.fruit}</option>
            <option value="other_sugar">{CATEGORY_LABELS.other_sugar}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">水分 %</span>
          <input
            type="number"
            step={0.1}
            value={waterPct}
            onChange={(e) => setWaterPct(e.target.valueAsNumber)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">糖分 %</span>
          <input
            type="number"
            step={0.1}
            value={sugarPct}
            onChange={(e) => setSugarPct(e.target.valueAsNumber)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">其他固形物 %</span>
          <input
            type="number"
            step={0.1}
            value={otherSolidsPct}
            onChange={(e) => setOtherSolidsPct(e.target.valueAsNumber)}
            className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-500">總固形物 %（自動計算）</span>
          <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
            {totalSolidsPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="list-inside list-disc rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {errors.map((err, i) => (
            <li key={i}>{err.message}</li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {initial ? '儲存修改' : '新增食材'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-700"
          >
            取消
          </button>
        )}
      </div>
    </form>
  )
}

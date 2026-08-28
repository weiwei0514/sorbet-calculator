'use client'

import { useState } from 'react'
import type { Ingredient, IngredientCategory, IngredientInput, ValidationError } from '@/lib/calculator/types'
import { INGREDIENT_CATEGORIES } from '@/lib/calculator/types'
import { validateIngredientComposition } from '@/lib/calculator/validate'
import { Button } from '@/components/ui/Button'

interface IngredientFormProps {
  initial?: Ingredient | null
  onSubmit: (input: IngredientInput) => Promise<void>
  onCancel?: () => void
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
  const [fatPct, setFatPct] = useState(initial?.fatPct ?? 0)
  const [nonFatSolidsPct, setNonFatSolidsPct] = useState(initial?.nonFatSolidsPct ?? 0)
  const [otherSolidsPct, setOtherSolidsPct] = useState(initial?.otherSolidsPct ?? 0)
  const [recommendedMinPct, setRecommendedMinPct] = useState(initial?.recommendedMinPct?.toString() ?? '')
  const [recommendedMaxPct, setRecommendedMaxPct] = useState(initial?.recommendedMaxPct?.toString() ?? '')
  const [podCoefficient, setPodCoefficient] = useState(initial?.podCoefficient?.toString() ?? '')
  const [pacCoefficient, setPacCoefficient] = useState(initial?.pacCoefficient?.toString() ?? '')
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [submitting, setSubmitting] = useState(false)

  const totalSolidsPct = sugarPct + fatPct + nonFatSolidsPct + otherSolidsPct

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const input: IngredientInput = {
      name,
      category,
      waterPct,
      sugarPct,
      fatPct,
      nonFatSolidsPct,
      otherSolidsPct,
      recommendedMinPct: recommendedMinPct.trim() === '' ? null : Number(recommendedMinPct),
      recommendedMaxPct: recommendedMaxPct.trim() === '' ? null : Number(recommendedMaxPct),
      podCoefficient: podCoefficient.trim() === '' ? null : Number(podCoefficient),
      pacCoefficient: pacCoefficient.trim() === '' ? null : Number(pacCoefficient),
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
            {INGREDIENT_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
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
          <FieldLabel>油脂 %</FieldLabel>
          <input
            type="number"
            step={0.1}
            value={fatPct}
            onChange={(e) => setFatPct(e.target.valueAsNumber)}
            style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
            className={`tabular ${inputClass}`}
          />
        </label>

        <label className="flex flex-col gap-2">
          <FieldLabel>無脂固形物 %</FieldLabel>
          <input
            type="number"
            step={0.1}
            value={nonFatSolidsPct}
            onChange={(e) => setNonFatSolidsPct(e.target.valueAsNumber)}
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

        <label className="flex flex-col gap-2">
          <FieldLabel>POD 係數（選填）</FieldLabel>
          <input
            type="number"
            step={0.01}
            value={podCoefficient}
            onChange={(e) => setPodCoefficient(e.target.value)}
            placeholder="例如 0.45"
            style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
            className={`tabular ${inputClass}`}
          />
          <span className="text-xs" style={{ color: 'var(--faint)' }}>
            請輸入小數（例如 0.45），不是百分比；蔗糖基準為 1.00
          </span>
        </label>

        <label className="flex flex-col gap-2">
          <FieldLabel>PAC 係數（選填）</FieldLabel>
          <input
            type="number"
            step={0.01}
            value={pacCoefficient}
            onChange={(e) => setPacCoefficient(e.target.value)}
            placeholder="例如 0.45"
            style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
            className={`tabular ${inputClass}`}
          />
          <span className="text-xs" style={{ color: 'var(--faint)' }}>
            請輸入小數（例如 0.45），不是百分比；蔗糖基準為 1.00
          </span>
        </label>

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

'use client'

import type { Ingredient } from '@/lib/calculator/types'
import type { GelatoInputs } from '@/lib/gelato/types'
import { NumberField } from '@/components/ui/NumberField'

function IngredientSelect({
  label,
  value,
  onChange,
  ingredients,
  allowNone = false,
}: {
  label: string
  value: string
  onChange: (id: string) => void
  ingredients: Ingredient[]
  allowNone?: boolean
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-b bg-transparent pb-1.5 text-base font-medium outline-none"
        style={{ borderColor: 'var(--rule)', color: 'var(--ink)' }}
      >
        <option value="">{allowNone ? '— 不使用 —' : '— 請選擇 —'}</option>
        {ingredients.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Step1Inputs({
  ingredients,
  inputs,
  onChange,
}: {
  ingredients: Ingredient[]
  inputs: GelatoInputs
  onChange: (patch: Partial<GelatoInputs>) => void
}) {
  const W = inputs.totalWeightG
  const g = (pctValue: number) => ((pctValue / 100) * W).toFixed(1)

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
        <NumberField
          label="最終總重量 Total Weight"
          value={inputs.totalWeightG}
          onChange={(v) => onChange({ totalWeightG: v })}
          min={1}
          step={50}
          suffix="g"
        />
        <NumberField
          label="脂肪 Fat（目標）"
          value={inputs.fatTargetPct}
          onChange={(v) => onChange({ fatTargetPct: v })}
          step={0.5}
          suffix="%"
          hint={`目標 ${g(inputs.fatTargetPct)} g`}
        />
        <NumberField
          label="無脂固形物 MSNF（目標）"
          value={inputs.msnfTargetPct}
          onChange={(v) => onChange({ msnfTargetPct: v })}
          step={0.5}
          suffix="%"
          hint={`目標 ${g(inputs.msnfTargetPct)} g`}
        />
        <NumberField
          label="蔗糖 Sucrose（固定加入）"
          value={inputs.sucrosePct}
          onChange={(v) => onChange({ sucrosePct: v })}
          step={0.5}
          suffix="%"
          hint={`加入 ${g(inputs.sucrosePct)} g`}
        />
        <NumberField
          label="膠體 Stabilizer（固定加入）"
          value={inputs.stabilizerPct}
          onChange={(v) => onChange({ stabilizerPct: v })}
          step={0.1}
          suffix="%"
          hint={`加入 ${g(inputs.stabilizerPct)} g`}
        />
        <NumberField
          label="蛋黃 Egg Yolk（固定加入，0 = 不使用）"
          value={inputs.eggYolkPct}
          onChange={(v) => onChange({ eggYolkPct: v })}
          step={0.5}
          suffix="%"
          hint={inputs.eggYolkPct > 0 ? `加入 ${g(inputs.eggYolkPct)} g` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-6 border-t pt-6 sm:grid-cols-3" style={{ borderColor: 'var(--rule)' }}>
        <IngredientSelect
          label="蔗糖對應食材"
          value={inputs.sucroseId}
          onChange={(id) => onChange({ sucroseId: id })}
          ingredients={ingredients}
        />
        <IngredientSelect
          label="膠體對應食材"
          value={inputs.stabilizerId}
          onChange={(id) => onChange({ stabilizerId: id })}
          ingredients={ingredients}
        />
        <IngredientSelect
          label="蛋黃對應食材"
          value={inputs.eggYolkId}
          onChange={(id) => onChange({ eggYolkId: id })}
          ingredients={ingredients}
          allowNone
        />
      </div>
    </div>
  )
}

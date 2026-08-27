import type { Ingredient, RecipeInputs } from '@/lib/calculator/types'
import { NumberField } from '@/components/ui/NumberField'
import { PercentField } from '@/components/ui/PercentField'
import { Section } from '@/components/ui/Section'

interface RecipeSettingsFormProps {
  inputs: RecipeInputs
  fruits: Ingredient[]
  otherSugars: Ingredient[]
  onChange: (patch: Partial<RecipeInputs>) => void
}

function SelectField({
  label,
  value,
  onChange,
  options,
  emptyLabel,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Ingredient[]
  emptyLabel: string
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="font-mono-label text-[10px]" style={{ color: 'var(--faint)' }}>
        {label}
      </span>
      <div className="border-b pb-1.5" style={{ borderColor: 'var(--rule)' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-lg font-medium outline-none"
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
    </label>
  )
}

export function RecipeSettingsForm({ inputs, fruits, otherSugars, onChange }: RecipeSettingsFormProps) {
  return (
    <Section eyebrow="Recipe Setup" title="配方設定">
      <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
        <NumberField
          label="最終配方重量"
          value={inputs.totalWeightG}
          onChange={(v) => onChange({ totalWeightG: v })}
          min={1}
          step={10}
          suffix="g"
        />

        <SelectField
          label="水果"
          value={inputs.fruitIngredientId}
          onChange={(v) => onChange({ fruitIngredientId: v })}
          options={fruits}
          emptyLabel="尚無水果資料"
        />

        <PercentField
          label="水果比例"
          value={inputs.fruitPct}
          onChange={(v) => onChange({ fruitPct: v })}
          min={25}
          max={60}
        />

        <PercentField
          label="目標總固形物"
          value={inputs.targetTotalSolidsPct}
          onChange={(v) => onChange({ targetTotalSolidsPct: v })}
          min={26}
          max={34}
        />

        <PercentField
          label="膠體比例"
          value={inputs.stabilizerPct}
          onChange={(v) => onChange({ stabilizerPct: v })}
          min={0}
          step={0.1}
        />

        <SelectField
          label="其他糖類"
          value={inputs.otherSugarIngredientId}
          onChange={(v) => onChange({ otherSugarIngredientId: v })}
          options={otherSugars}
          emptyLabel="尚無其他糖類資料"
        />

        <PercentField
          label="其他糖類比例"
          value={inputs.otherSugarPct}
          onChange={(v) => onChange({ otherSugarPct: v })}
          min={1}
          max={5}
        />
      </div>
    </Section>
  )
}

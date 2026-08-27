import type { Ingredient, RecipeInputs } from '@/lib/calculator/types'
import { NumberField } from '@/components/ui/NumberField'
import { PercentField } from '@/components/ui/PercentField'

interface RecipeSettingsFormProps {
  inputs: RecipeInputs
  fruits: Ingredient[]
  otherSugars: Ingredient[]
  onChange: (patch: Partial<RecipeInputs>) => void
}

export function RecipeSettingsForm({ inputs, fruits, otherSugars, onChange }: RecipeSettingsFormProps) {
  return (
    <section className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
      <h2 className="mb-4 text-lg font-semibold">配方設定</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <NumberField
          label="最終配方重量"
          value={inputs.totalWeightG}
          onChange={(v) => onChange({ totalWeightG: v })}
          min={1}
          step={10}
          suffix="g"
        />

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">水果</span>
          <select
            value={inputs.fruitIngredientId}
            onChange={(e) => onChange({ fruitIngredientId: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            {fruits.length === 0 && <option value="">尚無水果資料</option>}
            {fruits.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>

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

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">其他糖類</span>
          <select
            value={inputs.otherSugarIngredientId}
            onChange={(e) => onChange({ otherSugarIngredientId: e.target.value })}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            {otherSugars.length === 0 && <option value="">尚無其他糖類資料</option>}
            {otherSugars.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <PercentField
          label="其他糖類比例"
          value={inputs.otherSugarPct}
          onChange={(v) => onChange({ otherSugarPct: v })}
          min={1}
          max={5}
        />
      </div>
    </section>
  )
}

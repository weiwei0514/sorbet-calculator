import type { Ingredient, IngredientAmount, RecipeInputs } from '@/lib/calculator/types'
import { NumberField } from '@/components/ui/NumberField'
import { PercentField } from '@/components/ui/PercentField'
import { Section } from '@/components/ui/Section'
import { IngredientAmountRows } from './IngredientAmountRows'

interface RecipeSettingsFormProps {
  inputs: RecipeInputs
  fruits: Ingredient[]
  otherSugars: Ingredient[]
  others: Ingredient[]
  onChange: (patch: Partial<RecipeInputs>) => void
}

export function RecipeSettingsForm({ inputs, fruits, otherSugars, others, onChange }: RecipeSettingsFormProps) {
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

        <PercentField
          label="目標總固形物"
          value={inputs.targetTotalSolidsPct}
          onChange={(v) => onChange({ targetTotalSolidsPct: v })}
          min={26}
          max={34}
        />

        <IngredientAmountRows
          title="水果"
          rows={inputs.fruits}
          options={fruits}
          onChange={(rows: IngredientAmount[]) => onChange({ fruits: rows })}
          addLabel="+ 新增水果"
          emptyLabel="尚無水果資料"
          rangeMin={10}
          rangeMax={70}
          rangeUnitLabel="水果比例總和"
          newRowDefaultPct={10}
          showRecommendedHint
        />

        <IngredientAmountRows
          title="其他糖類"
          rows={inputs.otherSugars}
          options={otherSugars}
          onChange={(rows: IngredientAmount[]) => onChange({ otherSugars: rows })}
          addLabel="+ 新增其他糖類"
          emptyLabel="尚無其他糖類資料"
          rangeUnitLabel="其他糖類比例總和"
          newRowDefaultPct={1}
        />

        <IngredientAmountRows
          title="其他（辛香料、茶粉、乳製品…）"
          rows={inputs.others}
          options={others}
          onChange={(rows: IngredientAmount[]) => onChange({ others: rows })}
          addLabel="+ 新增其他食材"
          emptyLabel="尚無「其他」分類食材，請先到食材資料庫新增"
          rangeUnitLabel="其他比例總和"
          newRowDefaultPct={0.5}
          allowEmpty
        />

        <PercentField
          label="膠體比例"
          value={inputs.stabilizerPct}
          onChange={(v) => onChange({ stabilizerPct: v })}
          min={0}
          step={0.1}
        />
      </div>
    </Section>
  )
}

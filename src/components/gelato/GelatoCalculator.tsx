'use client'

import { useMemo, useState } from 'react'
import type { Ingredient } from '@/lib/calculator/types'
import { calculateGelato } from '@/lib/gelato/engine'
import { defaultGelatoInputs } from '@/lib/gelato/defaults'
import type { GelatoInputs } from '@/lib/gelato/types'
import { Section } from '@/components/ui/Section'
import { Step0Card } from './Step0Card'
import { Step1Inputs } from './Step1Inputs'
import { MaterialList } from './MaterialList'
import { BaseTriplePicker } from './BaseTriplePicker'
import { GelatoBreakdownTable, GelatoPodPacSummary, GelatoRecipeTable } from './GelatoResultView'
import { SaveGelatoRecipeButton } from './SaveGelatoRecipeButton'

function fmt(n: number, digits = 1) {
  return n.toLocaleString('zh-TW', { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

export function GelatoCalculator({
  initialIngredients,
  isDemo = false,
}: {
  initialIngredients: Ingredient[]
  isDemo?: boolean
}) {
  const ingredientsById = useMemo(
    () => new Map(initialIngredients.map((i) => [i.id, i])),
    [initialIngredients]
  )
  // Flavour/fixed dropdowns exclude the fruit rows (those are the Sorbet flow).
  const materialOptions = useMemo(
    () => initialIngredients.filter((i) => i.category !== 'fruit'),
    [initialIngredients]
  )

  const [inputs, setInputs] = useState<GelatoInputs>(() => defaultGelatoInputs(initialIngredients))

  // Deterministic + cheap → recompute on every edit (spec: 每次修改後自動重新計算).
  const result = useMemo(() => calculateGelato(inputs, ingredientsById), [inputs, ingredientsById])

  function patch(next: Partial<GelatoInputs>) {
    setInputs((prev) => ({ ...prev, ...next }))
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:gap-14 sm:px-6 sm:py-12 lg:px-10">
      <header className="border-b pb-6 sm:pb-8" style={{ borderColor: 'var(--wine)' }}>
        <p className="font-mono-label mb-3 text-[10px] sm:mb-4" style={{ color: 'var(--accent)' }}>
          Gelato Balancing Engine
        </p>
        <h1
          className="font-display text-4xl leading-none font-medium sm:text-5xl lg:text-6xl"
          style={{ color: 'var(--wine)' }}
        >
          Gelato 配方自動平衡計算器
        </h1>
        <p className="font-display mt-3 text-base italic sm:mt-4 sm:text-lg" style={{ color: 'var(--muted)' }}>
          設定目標 → 加入風味食材並扣除其成分 → 三元一次方程式補足基底 → 重新計算並驗收。
        </p>
      </header>

      {isDemo && (
        <p className="border-l-2 pl-6 text-sm" style={{ borderColor: 'var(--accent)', color: 'var(--muted)' }}>
          目前為內建示範食材資料。Gelato 計算需要資料庫中有蔗糖、穩定劑、以及三種基底乳製品等材料，
          請先設定 Supabase 並在食材資料庫維護實際數據。
        </p>
      )}

      <Section eyebrow="STEP 0 · Final Formula Standard" title="最終配方固定驗收範圍">
        <Step0Card />
      </Section>

      <Section eyebrow="STEP 1 · Base Targets" title="設定 Gelato 基礎目標">
        <Step1Inputs ingredients={materialOptions} inputs={inputs} onChange={patch} />
      </Section>

      <Section eyebrow="STEP 2A · Flavour Materials" title="風味食材（固定加入，計入 100%）">
        <MaterialList
          ingredients={materialOptions}
          rows={inputs.flavourMaterials}
          onChange={(flavourMaterials) => patch({ flavourMaterials })}
          addLabel="＋新增風味食材"
          emptyLabel="尚未加入風味食材（例：開心果醬、巧克力、水果泥、咖啡濃縮液）。"
        />
      </Section>

      <Section eyebrow="STEP 2B · Other Fixed Materials" title="其他固定食材（固定加入，計入 100%）">
        <MaterialList
          ingredients={materialOptions}
          rows={inputs.fixedMaterials}
          onChange={(fixedMaterials) => patch({ fixedMaterials })}
          addLabel="＋新增固定食材"
          emptyLabel="尚未加入其他固定食材。"
        />
      </Section>

      <Section eyebrow="STEP 2C · Base Ingredients (X / Y / Z)" title="三元一次方程式的三個主要基底食材">
        <BaseTriplePicker ingredients={materialOptions} inputs={inputs} onChange={patch} />
      </Section>

      <Section eyebrow="STEP 3 · Final Formula" title="最終配方">
        {result.ok ? (
          <div className="flex flex-col gap-10">
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-xs" style={{ color: 'var(--faint)' }}>
              <span className="tabular">Remaining Weight {fmt(result.recipe.remaining.weightG)} g</span>
              <span className="tabular">Remaining Fat {fmt(result.recipe.remaining.fatG)} g</span>
              <span className="tabular">Remaining MSNF {fmt(result.recipe.remaining.msnfG)} g</span>
            </div>

            <GelatoRecipeTable recipe={result.recipe} />

            <div>
              <p className="font-mono-label mb-4 text-[10px]" style={{ color: 'var(--faint)' }}>
                Analysis · 水份與固形物比例
              </p>
              <GelatoBreakdownTable recipe={result.recipe} />
            </div>

            <div>
              <p className="font-mono-label mb-4 text-[10px]" style={{ color: 'var(--faint)' }}>
                Sweetness &amp; Freezing Point · 甜度與抗凍力
              </p>
              <GelatoPodPacSummary recipe={result.recipe} />
            </div>

            <SaveGelatoRecipeButton inputs={inputs} recipe={result.recipe} />
          </div>
        ) : (
          <div className="border-l-2 py-1 pl-6" style={{ borderColor: 'var(--danger)' }}>
            <p className="font-mono-label mb-2 text-sm" style={{ color: 'var(--danger)' }}>
              {result.message}
            </p>
            {result.detail && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {result.detail}
              </p>
            )}
          </div>
        )}
      </Section>
    </div>
  )
}

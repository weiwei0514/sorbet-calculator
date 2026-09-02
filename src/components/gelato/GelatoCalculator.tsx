'use client'

import { useMemo, useState } from 'react'
import type { Ingredient } from '@/lib/calculator/types'
import { calculateGelato } from '@/lib/gelato/engine'
import { DEFAULT_GELATO_RANGES, defaultBaseDairy, defaultStep1 } from '@/lib/gelato/defaults'
import type { GelatoInputs, GelatoResult } from '@/lib/gelato/types'
import { Section } from '@/components/ui/Section'
import { NumberField } from '@/components/ui/NumberField'
import { Button } from '@/components/ui/Button'
import { TargetRangeEditor } from './TargetRangeEditor'
import { Step1ConstraintList } from './Step1ConstraintList'
import { FreeMaterialList } from './FreeMaterialList'
import { BaseDairyPicker } from './BaseDairyPicker'
import { GelatoAnalysis, GelatoRecipeTable } from './GelatoResultView'
import { GelatoInfeasibleView } from './GelatoInfeasibleView'
import { SaveGelatoRecipeButton } from './SaveGelatoRecipeButton'

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

  const [inputs, setInputs] = useState<GelatoInputs>(() => ({
    totalWeightG: 1000,
    ranges: structuredClone(DEFAULT_GELATO_RANGES),
    step1: defaultStep1(initialIngredients),
    free: [],
    baseDairy: defaultBaseDairy(initialIngredients),
  }))

  // The inputs snapshot alongside the result they produced — so "儲存配方" persists
  // exactly what was solved, even if the form is edited afterwards.
  const [computed, setComputed] = useState<{ inputs: GelatoInputs; result: GelatoResult } | null>(null)
  const [stale, setStale] = useState(true)
  const result = computed?.result ?? null

  function patch(next: Partial<GelatoInputs>) {
    setInputs((prev) => ({ ...prev, ...next }))
    setStale(true)
  }

  function recalculate() {
    const snapshot = structuredClone(inputs)
    setComputed({ inputs: snapshot, result: calculateGelato(snapshot, ingredientsById) })
    setStale(false)
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
          設定各項指標的允許範圍，程式在範圍內尋找配方，並用三元一次方程式求出基礎乳製品。
        </p>
      </header>

      {isDemo && (
        <p className="border-l-2 pl-6 text-sm" style={{ borderColor: 'var(--accent)', color: 'var(--muted)' }}>
          目前為內建示範食材資料。Gelato 計算需要資料庫中有「蔗糖」「脫脂奶粉」「奶油」「全脂牛奶」等材料，
          請先設定 Supabase 並在食材資料庫維護實際數據。
        </p>
      )}

      <Section eyebrow="Step 0 · Target Ranges" title="整體配方允許範圍">
        <TargetRangeEditor ranges={inputs.ranges} onChange={(ranges) => patch({ ranges })} />
      </Section>

      <Section eyebrow="Total Weight" title="最終配方重量">
        <div className="max-w-xs">
          <NumberField
            label="總重量"
            value={inputs.totalWeightG}
            onChange={(v) => patch({ totalWeightG: v })}
            min={1}
            step={50}
            suffix="g"
          />
        </div>
      </Section>

      <Section eyebrow="Step 1 · Constrained Materials" title="第一階段材料（設定允許區間）">
        <Step1ConstraintList
          ingredients={initialIngredients}
          rows={inputs.step1}
          onChange={(step1) => patch({ step1 })}
        />
      </Section>

      <Section eyebrow="Step 2 · Free Materials" title="自由加入食材（固定重量）">
        <FreeMaterialList
          ingredients={initialIngredients}
          rows={inputs.free}
          onChange={(free) => patch({ free })}
        />
      </Section>

      <Section eyebrow="Base Dairy · X / Y / Z" title="基礎乳製品（三元一次方程式）">
        <BaseDairyPicker
          ingredients={initialIngredients}
          value={inputs.baseDairy}
          onChange={(baseDairy) => patch({ baseDairy })}
        />
      </Section>

      <div className="flex flex-col gap-3">
        <Button onClick={recalculate} className="w-full sm:w-auto">
          重新計算
        </Button>
        {stale && result && (
          <p className="text-xs" style={{ color: 'var(--faint)' }}>
            設定已變更，下方結果為舊配方，請按「重新計算」。
          </p>
        )}
      </div>

      {result && (
        <div style={{ opacity: stale ? 0.45 : 1 }}>
          {result.ok ? (
            <Section eyebrow="Final Recipe" title="最終配方">
              <div className="flex flex-col gap-10">
                <GelatoRecipeTable recipe={result.recipe} />
                <div>
                  <p className="font-mono-label mb-4 text-[10px]" style={{ color: 'var(--faint)' }}>
                    Analysis · 配方分析
                  </p>
                  <GelatoAnalysis recipe={result.recipe} />
                </div>
                {!stale && computed && (
                  <SaveGelatoRecipeButton inputs={computed.inputs} recipe={result.recipe} />
                )}
              </div>
            </Section>
          ) : result.reason === 'infeasible' ? (
            <Section eyebrow="Result" title="平衡結果">
              <GelatoInfeasibleView result={result} />
            </Section>
          ) : (
            <div className="border-l-2 py-1 pl-6" style={{ borderColor: 'var(--danger)' }}>
              <p className="font-mono-label mb-2 text-[10px]" style={{ color: 'var(--danger)' }}>
                Cannot Calculate · 無法計算
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {result.message}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

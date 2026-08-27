'use client'

import { useMemo, useState } from 'react'
import type { Ingredient, RecipeInputs } from '@/lib/calculator/types'
import { calculateRecipe } from '@/lib/calculator/engine'
import { RecipeSettingsForm } from './RecipeSettingsForm'
import { ComputedRecipeTable } from './ComputedRecipeTable'
import { RecipeAnalysisTable } from './RecipeAnalysisTable'
import { ErrorBanner } from './ErrorBanner'
import { IngredientManager } from '@/components/ingredients/IngredientManager'

const DEFAULT_INPUTS: Omit<RecipeInputs, 'fruitIngredientId' | 'otherSugarIngredientId'> = {
  totalWeightG: 1000,
  fruitPct: 40,
  targetTotalSolidsPct: 30,
  stabilizerPct: 0.5,
  otherSugarPct: 3,
}

interface CalculatorAppProps {
  initialIngredients: Ingredient[]
  isDemo?: boolean
}

export function CalculatorApp({ initialIngredients, isDemo = false }: CalculatorAppProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients)

  const fruits = useMemo(() => ingredients.filter((i) => i.category === 'fruit'), [ingredients])
  const otherSugars = useMemo(() => ingredients.filter((i) => i.category === 'other_sugar'), [ingredients])

  const [inputs, setInputs] = useState<RecipeInputs>(() => ({
    ...DEFAULT_INPUTS,
    fruitIngredientId: initialIngredients.find((i) => i.category === 'fruit')?.id ?? '',
    otherSugarIngredientId: initialIngredients.find((i) => i.category === 'other_sugar')?.id ?? '',
  }))

  function handleInputsChange(patch: Partial<RecipeInputs>) {
    setInputs((prev) => ({ ...prev, ...patch }))
  }

  // Fall back to the first available ingredient of the right category if the
  // previously selected one no longer exists (e.g. deleted via the manager below).
  // Computed during render rather than synced back into state via an effect.
  const selectedFruit = fruits.find((f) => f.id === inputs.fruitIngredientId) ?? fruits[0]
  const selectedOtherSugar = otherSugars.find((s) => s.id === inputs.otherSugarIngredientId) ?? otherSugars[0]

  const effectiveInputs: RecipeInputs = useMemo(
    () => ({
      ...inputs,
      fruitIngredientId: selectedFruit?.id ?? '',
      otherSugarIngredientId: selectedOtherSugar?.id ?? '',
    }),
    [inputs, selectedFruit, selectedOtherSugar]
  )

  const outcome = useMemo(() => {
    if (!selectedFruit || !selectedOtherSugar) {
      return {
        ok: false as const,
        result: null,
        errors: [
          {
            field: 'ingredients',
            code: 'MISSING_INGREDIENT',
            message: '請先在下方食材資料庫新增至少一種水果與一種其他糖類，才能計算配方。',
          },
        ],
      }
    }
    return calculateRecipe({ inputs: effectiveInputs, fruit: selectedFruit, otherSugar: selectedOtherSugar })
  }, [effectiveInputs, selectedFruit, selectedOtherSugar])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:gap-14 sm:px-6 sm:py-16 lg:px-10">
      <header className="border-b pb-6 sm:pb-8" style={{ borderColor: 'var(--wine)' }}>
        <p className="font-mono-label mb-3 text-[10px] sm:mb-4" style={{ color: 'var(--gold)' }}>
          Sorbet Recipe Engine
        </p>
        <h1
          className="font-display text-4xl leading-none font-medium sm:text-5xl lg:text-6xl"
          style={{ color: 'var(--wine)' }}
        >
          配方自動計算器
        </h1>
        <p className="font-display mt-3 text-base italic sm:mt-4 sm:text-lg" style={{ color: 'var(--muted)' }}>
          依水果比例、目標總固形物、膠體與其他糖類，自動反推完整配方。
        </p>
      </header>

      {isDemo && (
        <p className="border-l-2 pl-6 text-sm" style={{ borderColor: 'var(--gold)', color: 'var(--muted)' }}>
          目前顯示的是內建示範食材資料（尚未連接 Supabase），計算功能可正常使用，但食材資料庫的新增/修改/刪除不會被儲存。請依 README
          設定 Supabase 後即可持久保存食材資料。
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-x-12 gap-y-10 sm:gap-y-14 lg:grid-cols-[360px_1fr]">
        <div className="lg:sticky lg:top-10">
          <RecipeSettingsForm
            inputs={effectiveInputs}
            fruits={fruits}
            otherSugars={otherSugars}
            onChange={handleInputsChange}
          />
        </div>

        <div className="flex flex-col gap-10 sm:gap-14">
          {!outcome.ok && <ErrorBanner errors={outcome.errors} />}

          {outcome.ok && (
            <>
              <ComputedRecipeTable components={outcome.result.components} totals={outcome.result.totals} />
              <RecipeAnalysisTable result={outcome.result} />
            </>
          )}
        </div>
      </div>

      <IngredientManager ingredients={ingredients} onIngredientsChange={setIngredients} />
    </div>
  )
}

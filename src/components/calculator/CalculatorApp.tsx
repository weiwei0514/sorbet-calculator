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

export function CalculatorApp({ initialIngredients }: { initialIngredients: Ingredient[] }) {
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
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Sorbet 配方自動計算器</h1>
        <p className="text-sm text-neutral-500">依水果比例、目標總固形物、膠體與其他糖類，自動反推完整配方。</p>
      </header>

      <RecipeSettingsForm
        inputs={effectiveInputs}
        fruits={fruits}
        otherSugars={otherSugars}
        onChange={handleInputsChange}
      />

      {!outcome.ok && <ErrorBanner errors={outcome.errors} />}

      {outcome.ok && (
        <>
          <ComputedRecipeTable components={outcome.result.components} totals={outcome.result.totals} />
          <RecipeAnalysisTable result={outcome.result} />
        </>
      )}

      <IngredientManager ingredients={ingredients} onIngredientsChange={setIngredients} />
    </div>
  )
}

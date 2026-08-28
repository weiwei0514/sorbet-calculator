'use client'

import { useMemo, useState } from 'react'
import type { Ingredient, IngredientAmount, RecipeInputs } from '@/lib/calculator/types'
import { calculateRecipe, type WeightedIngredient } from '@/lib/calculator/engine'
import { RecipeSettingsForm } from './RecipeSettingsForm'
import { ComputedRecipeTable } from './ComputedRecipeTable'
import { RecipeAnalysisTable } from './RecipeAnalysisTable'
import { PodPacPanel } from './PodPacPanel'
import { ErrorBanner } from './ErrorBanner'
import { SaveRecipeButton } from './SaveRecipeButton'

const DEFAULT_INPUTS: Omit<RecipeInputs, 'fruits' | 'otherSugars' | 'others'> = {
  totalWeightG: 1000,
  targetTotalSolidsPct: 30,
  stabilizerPct: 0.5,
  targetPOD: null,
  targetPAC: null,
}

interface CalculatorAppProps {
  initialIngredients: Ingredient[]
  isDemo?: boolean
}

/** Falls back any row pointing at a since-deleted ingredient to the first available
 *  option of that category — same spirit as the old single-select fallback, applied per row. */
function sanitizeRows(rows: IngredientAmount[], options: Ingredient[]): IngredientAmount[] {
  if (options.length === 0) return rows
  return rows.map((r) => (options.some((o) => o.id === r.ingredientId) ? r : { ...r, ingredientId: options[0].id }))
}

function resolveRows(rows: IngredientAmount[], options: Ingredient[]): WeightedIngredient[] {
  return rows.flatMap((r) => {
    const ingredient = options.find((o) => o.id === r.ingredientId)
    return ingredient ? [{ ingredient, pct: r.pct }] : []
  })
}

export function CalculatorApp({ initialIngredients, isDemo = false }: CalculatorAppProps) {
  // Ingredient CRUD now lives on its own /ingredients page — this page only reads the
  // list fetched at request time (Next.js re-fetches on navigation, so edits made there
  // show up here automatically next time this page loads).
  const fruits = useMemo(() => initialIngredients.filter((i) => i.category === 'fruit'), [initialIngredients])
  const otherSugars = useMemo(
    () => initialIngredients.filter((i) => i.category === 'other_sugar'),
    [initialIngredients]
  )
  const others = useMemo(() => initialIngredients.filter((i) => i.category === 'other'), [initialIngredients])

  const [inputs, setInputs] = useState<RecipeInputs>(() => ({
    ...DEFAULT_INPUTS,
    fruits: [{ ingredientId: initialIngredients.find((i) => i.category === 'fruit')?.id ?? '', pct: 40 }],
    otherSugars: [{ ingredientId: initialIngredients.find((i) => i.category === 'other_sugar')?.id ?? '', pct: 3 }],
    // 「其他」預設留空 — 使用者要用時自己新增。
    others: [],
  }))

  function handleInputsChange(patch: Partial<RecipeInputs>) {
    setInputs((prev) => ({ ...prev, ...patch }))
  }

  // Fall back stale ingredient ids (e.g. deleted via the manager below) to the first
  // available option of that category. Computed during render rather than synced back
  // into state via an effect.
  const effectiveInputs: RecipeInputs = useMemo(
    () => ({
      ...inputs,
      fruits: sanitizeRows(inputs.fruits, fruits),
      otherSugars: sanitizeRows(inputs.otherSugars, otherSugars),
      others: sanitizeRows(inputs.others, others),
    }),
    [inputs, fruits, otherSugars, others]
  )

  const outcome = useMemo(() => {
    const resolvedFruits = resolveRows(effectiveInputs.fruits, fruits)
    const resolvedOtherSugars = resolveRows(effectiveInputs.otherSugars, otherSugars)
    const resolvedOthers = resolveRows(effectiveInputs.others, others)
    return calculateRecipe({
      inputs: effectiveInputs,
      fruits: resolvedFruits,
      otherSugars: resolvedOtherSugars,
      others: resolvedOthers,
    })
  }, [effectiveInputs, fruits, otherSugars, others])

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:gap-14 sm:px-6 sm:py-16 lg:px-10">
      <header className="border-b pb-6 sm:pb-8" style={{ borderColor: 'var(--wine)' }}>
        <p className="font-mono-label mb-3 text-[10px] sm:mb-4" style={{ color: 'var(--accent)' }}>
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
        <p className="border-l-2 pl-6 text-sm" style={{ borderColor: 'var(--accent)', color: 'var(--muted)' }}>
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
            others={others}
            onChange={handleInputsChange}
          />
        </div>

        <div className="flex flex-col gap-10 sm:gap-14">
          {!outcome.ok && <ErrorBanner errors={outcome.errors} />}

          {outcome.ok && (
            <>
              <SaveRecipeButton inputs={outcome.result.inputs} result={outcome.result} />
              <ComputedRecipeTable components={outcome.result.components} totals={outcome.result.totals} />
              <RecipeAnalysisTable result={outcome.result} />
              <PodPacPanel result={outcome.result} sugarCandidates={otherSugars} onTargetChange={handleInputsChange} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

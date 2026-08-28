'use client'

import { useState } from 'react'
import type { Ingredient } from '@/lib/calculator/types'
import { IngredientManager } from './IngredientManager'

export function IngredientsPageClient({ initialIngredients }: { initialIngredients: Ingredient[] }) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:gap-14 sm:px-6 sm:py-16 lg:px-10">
      <header className="border-b pb-6 sm:pb-8" style={{ borderColor: 'var(--wine)' }}>
        <p className="font-mono-label mb-3 text-[10px] sm:mb-4" style={{ color: 'var(--accent)' }}>
          Ingredient Database
        </p>
        <h1
          className="font-display text-4xl leading-none font-medium sm:text-5xl lg:text-6xl"
          style={{ color: 'var(--wine)' }}
        >
          食材資料庫
        </h1>
        <p className="font-display mt-3 text-base italic sm:mt-4 sm:text-lg" style={{ color: 'var(--muted)' }}>
          管理水果與其他糖類的成分資料，供計算機的下拉選單使用。
        </p>
      </header>

      <IngredientManager ingredients={ingredients} onIngredientsChange={setIngredients} />
    </div>
  )
}

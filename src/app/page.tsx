import { CalculatorApp } from '@/components/calculator/CalculatorApp'
import { createClient } from '@/lib/supabase/server'
import { getIngredients } from '@/lib/ingredients/queries'
import { DEMO_INGREDIENTS } from '@/lib/ingredients/demoData'
import type { Ingredient } from '@/lib/calculator/types'

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && anonKey && !url.startsWith('your_') && !anonKey.startsWith('your_'))
}

export default async function Home() {
  if (!isSupabaseConfigured()) {
    return <CalculatorApp initialIngredients={DEMO_INGREDIENTS} isDemo />
  }

  let ingredients: Ingredient[] = []
  let loadError: string | null = null
  try {
    const supabase = await createClient()
    ingredients = await getIngredients(supabase)
  } catch (e) {
    console.error(e)
    loadError = '無法讀取食材資料庫，請確認 Supabase 專案已執行 supabase/schema.sql，且 .env.local 金鑰正確。'
  }

  if (loadError) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-16 lg:px-10">
        <h1 className="font-display text-3xl font-medium sm:text-4xl" style={{ color: 'var(--wine)' }}>
          Sorbet 配方自動計算器
        </h1>
        <p className="border-l-2 pl-6 text-sm" style={{ borderColor: 'var(--wine)', color: 'var(--muted)' }}>
          {loadError}
        </p>
      </div>
    )
  }

  return <CalculatorApp initialIngredients={ingredients} />
}

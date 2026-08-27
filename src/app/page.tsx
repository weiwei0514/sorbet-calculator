import { CalculatorApp } from '@/components/calculator/CalculatorApp'
import { createClient } from '@/lib/supabase/server'
import { getIngredients } from '@/lib/ingredients/queries'
import type { Ingredient } from '@/lib/calculator/types'

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && anonKey && !url.startsWith('your_') && !anonKey.startsWith('your_'))
}

export default async function Home() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-bold">Sorbet 配方自動計算器</h1>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          尚未設定 Supabase。請在 Supabase 建立新專案、於 SQL Editor 執行 <code>supabase/schema.sql</code>，
          再把專案的 URL 與 anon key 填入 <code>.env.local</code> 中的{' '}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> / <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>，然後重新整理此頁面。
        </p>
      </div>
    )
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
      <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-bold">Sorbet 配方自動計算器</h1>
        <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {loadError}
        </p>
      </div>
    )
  }

  return <CalculatorApp initialIngredients={ingredients} />
}

import { SavedRecipesList } from '@/components/saved/SavedRecipesList'
import { SupabaseNotice } from '@/components/SupabaseNotice'
import { createClient } from '@/lib/supabase/server'
import { getSavedRecipes } from '@/lib/savedRecipes/queries'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { SavedRecipe } from '@/lib/calculator/types'

export default async function SavedRecipesPage() {
  if (!isSupabaseConfigured()) {
    return (
      <SupabaseNotice
        variant="warning"
        title="已儲存配方"
        message="尚未設定 Supabase，無法儲存或查看配方。請依 README 設定 Supabase 專案金鑰。"
      />
    )
  }

  let recipes: SavedRecipe[] = []
  let loadError: string | null = null
  try {
    const supabase = await createClient()
    recipes = await getSavedRecipes(supabase)
  } catch (e) {
    console.error(e)
    loadError =
      '無法讀取已儲存配方，請確認 Supabase 專案已執行 supabase/migrations/0003_saved_recipes.sql，且 .env.local 金鑰正確。'
  }

  if (loadError) {
    return <SupabaseNotice variant="error" title="已儲存配方" message={loadError} />
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:gap-14 sm:px-6 sm:py-16 lg:px-10">
      <header className="border-b pb-6 sm:pb-8" style={{ borderColor: 'var(--wine)' }}>
        <p className="font-mono-label mb-3 text-[10px] sm:mb-4" style={{ color: 'var(--accent)' }}>
          Saved Recipes
        </p>
        <h1
          className="font-display text-4xl leading-none font-medium sm:text-5xl lg:text-6xl"
          style={{ color: 'var(--wine)' }}
        >
          已儲存配方
        </h1>
        <p className="font-display mt-3 text-base italic sm:mt-4 sm:text-lg" style={{ color: 'var(--muted)' }}>
          在計算機頁面按「儲存配方」命名保存的配方快照。
        </p>
      </header>

      <SavedRecipesList initialRecipes={recipes} />
    </div>
  )
}

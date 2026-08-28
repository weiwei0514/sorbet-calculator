import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import { getIngredients } from './queries'
import { DEMO_INGREDIENTS } from './demoData'
import type { Ingredient } from '@/lib/calculator/types'

export type LoadIngredientsResult =
  | { status: 'demo'; ingredients: Ingredient[] }
  | { status: 'error'; ingredients: []; message: string }
  | { status: 'ok'; ingredients: Ingredient[] }

/** Shared by every page that needs the ingredient list (/ and /ingredients):
 *  falls back to read-only demo data when Supabase isn't configured yet,
 *  surfaces a friendly message on a real fetch failure, otherwise loads live data. */
export async function loadIngredientsForPage(): Promise<LoadIngredientsResult> {
  if (!isSupabaseConfigured()) {
    return { status: 'demo', ingredients: DEMO_INGREDIENTS }
  }

  try {
    const supabase = await createClient()
    const ingredients = await getIngredients(supabase)
    return { status: 'ok', ingredients }
  } catch (e) {
    console.error(e)
    return {
      status: 'error',
      ingredients: [],
      message: '無法讀取食材資料庫，請確認 Supabase 專案已執行 supabase/schema.sql，且 .env.local 金鑰正確。',
    }
  }
}

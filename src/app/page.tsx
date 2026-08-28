import { CalculatorApp } from '@/components/calculator/CalculatorApp'
import { SupabaseNotice } from '@/components/SupabaseNotice'
import { loadIngredientsForPage } from '@/lib/ingredients/loadIngredientsForPage'

export default async function Home() {
  const loaded = await loadIngredientsForPage()

  if (loaded.status === 'error') {
    return <SupabaseNotice variant="error" title="Sorbet 配方自動計算器" message={loaded.message} />
  }

  return <CalculatorApp initialIngredients={loaded.ingredients} isDemo={loaded.status === 'demo'} />
}

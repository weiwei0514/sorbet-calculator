import { IngredientsPageClient } from '@/components/ingredients/IngredientsPageClient'
import { SupabaseNotice } from '@/components/SupabaseNotice'
import { loadIngredientsForPage } from '@/lib/ingredients/loadIngredientsForPage'

export default async function IngredientsPage() {
  const loaded = await loadIngredientsForPage()

  if (loaded.status === 'error') {
    return <SupabaseNotice variant="error" title="食材資料庫" message={loaded.message} />
  }

  return (
    <>
      {loaded.status === 'demo' && (
        <div className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 sm:pt-16 lg:px-10">
          <p className="border-l-2 pl-6 text-sm" style={{ borderColor: 'var(--accent)', color: 'var(--muted)' }}>
            目前顯示的是內建示範食材資料（尚未連接 Supabase），新增/修改/刪除不會被儲存。請依 README 設定 Supabase
            後即可持久保存食材資料。
          </p>
        </div>
      )}
      <IngredientsPageClient initialIngredients={loaded.ingredients} />
    </>
  )
}

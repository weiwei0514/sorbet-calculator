'use client'

import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Ingredient, IngredientInput } from '@/lib/calculator/types'
import { createClient } from '@/lib/supabase/client'
import { extractSupabaseMessage } from '@/lib/supabase/errors'
import { createIngredient, deleteIngredient, updateIngredient } from '@/lib/ingredients/mutations'
import { IngredientForm } from './IngredientForm'
import { IngredientTable } from './IngredientTable'
import { IngredientSearchBar } from './IngredientSearchBar'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'

interface IngredientManagerProps {
  ingredients: Ingredient[]
  onIngredientsChange: (ingredients: Ingredient[]) => void
}

const CATEGORY_TABS: { value: 'all' | 'fruit' | 'other_sugar'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'fruit', label: '水果' },
  { value: 'other_sugar', label: '其他糖類' },
]

const NOT_CONFIGURED_MESSAGE =
  '無法連線到食材資料庫，請確認 .env.local 是否已填入正確的 Supabase 專案金鑰（NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY），並已在 Supabase 執行過 supabase/schema.sql。'

/** Constructing the client throws synchronously if the env vars are placeholders/invalid.
 *  Deferred to each action (rather than useMemo at mount) so a misconfigured Supabase
 *  project surfaces as the same inline error message instead of crashing the component tree. */
function getSupabaseClientOrNull(): SupabaseClient | null {
  try {
    return createClient()
  } catch {
    return null
  }
}

export function IngredientManager({ ingredients, onIngredientsChange }: IngredientManagerProps) {
  const [search, setSearch] = useState('')
  const [categoryTab, setCategoryTab] = useState<'all' | 'fruit' | 'other_sugar'>('all')
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [adding, setAdding] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const filtered = ingredients
    .filter((i) => categoryTab === 'all' || i.category === categoryTab)
    .filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))

  const allExpanded = filtered.length > 0 && filtered.every((i) => expandedIds.has(i.id))

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleExpandAll() {
    setExpandedIds(allExpanded ? new Set() : new Set(filtered.map((i) => i.id)))
  }

  function handleSupabaseError(e: unknown) {
    console.error(e)
    const detail = extractSupabaseMessage(e)
    setErrorMessage(
      detail
        ? `資料庫操作失敗：${detail}（若欄位不存在，通常代表 supabase/migrations/ 底下有些 SQL 還沒在 Supabase 執行過）`
        : NOT_CONFIGURED_MESSAGE
    )
  }

  async function handleCreate(input: IngredientInput) {
    setErrorMessage(null)
    const supabase = getSupabaseClientOrNull()
    if (!supabase) return handleSupabaseError(null)
    try {
      const outcome = await createIngredient(supabase, input)
      if (!outcome.ok) return
      onIngredientsChange([...ingredients, outcome.ingredient])
      setAdding(false)
    } catch (e) {
      handleSupabaseError(e)
    }
  }

  async function handleUpdate(input: IngredientInput) {
    if (!editing) return
    setErrorMessage(null)
    const supabase = getSupabaseClientOrNull()
    if (!supabase) return handleSupabaseError(null)
    try {
      const outcome = await updateIngredient(supabase, editing.id, input)
      if (!outcome.ok) return
      onIngredientsChange(ingredients.map((i) => (i.id === outcome.ingredient.id ? outcome.ingredient : i)))
      setEditing(null)
    } catch (e) {
      handleSupabaseError(e)
    }
  }

  async function handleDelete(ingredient: Ingredient) {
    setErrorMessage(null)
    const supabase = getSupabaseClientOrNull()
    if (!supabase) return handleSupabaseError(null)
    try {
      await deleteIngredient(supabase, ingredient.id)
      onIngredientsChange(ingredients.filter((i) => i.id !== ingredient.id))
    } catch (e) {
      handleSupabaseError(e)
    }
  }

  return (
    <Section
      eyebrow="Ingredient Database"
      title="食材資料庫"
      action={
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <IngredientSearchBar value={search} onChange={setSearch} />
          {!adding && !editing && (
            <Button className="w-full sm:w-auto" onClick={() => setAdding(true)}>
              新增食材
            </Button>
          )}
        </div>
      }
    >
      {errorMessage && (
        <p className="mb-6 border-l-2 pl-6 text-sm" style={{ borderColor: 'var(--danger)', color: 'var(--muted)' }}>
          {errorMessage}
        </p>
      )}

      {adding && (
        <div className="mb-8">
          <IngredientForm onSubmit={handleCreate} onCancel={() => setAdding(false)} />
        </div>
      )}

      {editing && (
        <div className="mb-8">
          <IngredientForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-4 border-b" style={{ borderColor: 'var(--rule)' }}>
        <div className="flex gap-6 overflow-x-auto">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategoryTab(tab.value)}
              className="font-mono-label -mb-px flex min-h-11 shrink-0 items-center border-b-2 text-sm"
              style={{
                borderColor: categoryTab === tab.value ? 'var(--accent)' : 'transparent',
                color: categoryTab === tab.value ? 'var(--accent)' : 'var(--faint)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={toggleExpandAll}
          className="font-mono-label min-h-11 shrink-0 text-sm hover:underline sm:hidden"
          style={{ color: 'var(--accent)' }}
        >
          {allExpanded ? '全部收合' : '全部展開'}
        </button>
      </div>

      <IngredientTable
        ingredients={filtered}
        onEdit={setEditing}
        onDelete={handleDelete}
        expandedIds={expandedIds}
        onToggleExpanded={toggleExpanded}
      />
    </Section>
  )
}

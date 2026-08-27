'use client'

import { useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Ingredient, IngredientInput } from '@/lib/calculator/types'
import { createClient } from '@/lib/supabase/client'
import { createIngredient, deleteIngredient, updateIngredient } from '@/lib/ingredients/mutations'
import { IngredientForm } from './IngredientForm'
import { IngredientTable } from './IngredientTable'
import { IngredientSearchBar } from './IngredientSearchBar'

interface IngredientManagerProps {
  ingredients: Ingredient[]
  onIngredientsChange: (ingredients: Ingredient[]) => void
}

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
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [adding, setAdding] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filtered = ingredients.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))

  function handleSupabaseError(e: unknown) {
    console.error(e)
    setErrorMessage(NOT_CONFIGURED_MESSAGE)
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
    <section className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">食材資料庫</h2>
        <div className="flex items-center gap-3">
          <IngredientSearchBar value={search} onChange={setSearch} />
          {!adding && !editing && (
            <button
              onClick={() => setAdding(true)}
              className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
            >
              新增食材
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          {errorMessage}
        </p>
      )}

      {adding && (
        <div className="mb-4">
          <IngredientForm onSubmit={handleCreate} onCancel={() => setAdding(false)} />
        </div>
      )}

      {editing && (
        <div className="mb-4">
          <IngredientForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
        </div>
      )}

      <IngredientTable ingredients={filtered} onEdit={setEditing} onDelete={handleDelete} />
    </section>
  )
}

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Ingredient, IngredientInput, ValidationError } from '@/lib/calculator/types'
import { validateIngredientComposition } from '@/lib/calculator/validate'
import { rowToIngredient, type IngredientRow } from './mapping'

export type MutationOutcome =
  | { ok: true; ingredient: Ingredient; errors: [] }
  | { ok: false; ingredient: null; errors: ValidationError[] }

function toRowInput(input: IngredientInput) {
  return {
    name: input.name,
    category: input.category,
    water_pct: input.waterPct,
    sugar_pct: input.sugarPct,
    other_solids_pct: input.otherSolidsPct,
  }
}

export async function createIngredient(client: SupabaseClient, input: IngredientInput): Promise<MutationOutcome> {
  const errors = validateIngredientComposition(input)
  if (errors.length > 0) return { ok: false, ingredient: null, errors }

  const { data, error } = await client.from('ingredients').insert(toRowInput(input)).select('*').single()
  if (error) throw error
  return { ok: true, ingredient: rowToIngredient(data as IngredientRow), errors: [] }
}

export async function updateIngredient(
  client: SupabaseClient,
  id: string,
  input: IngredientInput
): Promise<MutationOutcome> {
  const errors = validateIngredientComposition(input)
  if (errors.length > 0) return { ok: false, ingredient: null, errors }

  const { data, error } = await client
    .from('ingredients')
    .update(toRowInput(input))
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return { ok: true, ingredient: rowToIngredient(data as IngredientRow), errors: [] }
}

export async function deleteIngredient(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('ingredients').delete().eq('id', id)
  if (error) throw error
}

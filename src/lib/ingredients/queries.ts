import type { SupabaseClient } from '@supabase/supabase-js'
import type { Ingredient } from '@/lib/calculator/types'
import { rowToIngredient, type IngredientRow } from './mapping'

export async function getIngredients(client: SupabaseClient): Promise<Ingredient[]> {
  const { data, error } = await client
    .from('ingredients')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return (data as IngredientRow[]).map(rowToIngredient)
}

export async function getIngredientById(client: SupabaseClient, id: string): Promise<Ingredient | null> {
  const { data, error } = await client.from('ingredients').select('*').eq('id', id).maybeSingle()

  if (error) throw error
  return data ? rowToIngredient(data as IngredientRow) : null
}

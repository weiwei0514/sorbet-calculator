import type { SupabaseClient } from '@supabase/supabase-js'
import type { SavedRecipe } from '@/lib/calculator/types'
import { rowToSavedRecipe, type SavedRecipeRow } from './mapping'

export async function getSavedRecipes(client: SupabaseClient): Promise<SavedRecipe[]> {
  const { data, error } = await client.from('saved_recipes').select('*').order('created_at', { ascending: false })

  if (error) throw error
  return (data as SavedRecipeRow[]).map(rowToSavedRecipe)
}

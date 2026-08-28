import type { SupabaseClient } from '@supabase/supabase-js'
import type { RecipeInputs, RecipeResult, SavedRecipe } from '@/lib/calculator/types'
import { rowToSavedRecipe, type SavedRecipeRow } from './mapping'

export interface CreateSavedRecipeInput {
  name: string
  inputs: RecipeInputs
  result: RecipeResult
}

export async function createSavedRecipe(client: SupabaseClient, input: CreateSavedRecipeInput): Promise<SavedRecipe> {
  const { data, error } = await client
    .from('saved_recipes')
    .insert({ name: input.name, inputs: input.inputs, result: input.result })
    .select('*')
    .single()
  if (error) throw error
  return rowToSavedRecipe(data as SavedRecipeRow)
}

export async function deleteSavedRecipe(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('saved_recipes').delete().eq('id', id)
  if (error) throw error
}

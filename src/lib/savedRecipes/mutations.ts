import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  RecipeAiAnalysis,
  RecipeInputs,
  RecipeResult,
  SavedGelatoRecipe,
  SavedSorbetRecipe,
} from '@/lib/calculator/types'
import type { GelatoInputs, GelatoRecipeSnapshot } from '@/lib/gelato/types'
import { rowToSavedRecipe, type SavedRecipeRow } from './mapping'

export interface CreateSavedRecipeInput {
  name: string
  /** 備註 — optional free text; stored as '' when omitted. */
  note?: string
  inputs: RecipeInputs
  result: RecipeResult
}

export async function createSavedRecipe(
  client: SupabaseClient,
  input: CreateSavedRecipeInput
): Promise<SavedSorbetRecipe> {
  const { data, error } = await client
    .from('saved_recipes')
    .insert({ name: input.name, note: input.note ?? '', kind: 'sorbet', inputs: input.inputs, result: input.result })
    .select('*')
    .single()
  if (error) throw error
  return rowToSavedRecipe(data as SavedRecipeRow) as SavedSorbetRecipe
}

export interface CreateSavedGelatoRecipeInput {
  name: string
  note?: string
  inputs: GelatoInputs
  result: GelatoRecipeSnapshot
}

export async function createSavedGelatoRecipe(
  client: SupabaseClient,
  input: CreateSavedGelatoRecipeInput
): Promise<SavedGelatoRecipe> {
  const { data, error } = await client
    .from('saved_recipes')
    .insert({ name: input.name, note: input.note ?? '', kind: 'gelato', inputs: input.inputs, result: input.result })
    .select('*')
    .single()
  if (error) throw error
  return rowToSavedRecipe(data as SavedRecipeRow) as SavedGelatoRecipe
}

export async function deleteSavedRecipe(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('saved_recipes').delete().eq('id', id)
  if (error) throw error
}

/** Updates the free-text 備註 on a saved recipe (see migration 0006). */
export async function updateSavedRecipeNote(client: SupabaseClient, id: string, note: string): Promise<void> {
  const { error } = await client.from('saved_recipes').update({ note }).eq('id', id)
  if (error) throw error
}

/** Caches an AI 風味分析 onto a saved recipe row (see migration 0005). */
export async function saveRecipeAiAnalysis(
  client: SupabaseClient,
  id: string,
  analysis: RecipeAiAnalysis
): Promise<void> {
  const { error } = await client.from('saved_recipes').update({ ai_analysis: analysis }).eq('id', id)
  if (error) throw error
}

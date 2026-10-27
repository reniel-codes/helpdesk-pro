// All asset database calls. Same pattern as features/tickets/api.ts:
// pages call these functions, tests replace this file with fakes, and RLS
// decides what each user gets back (employees only see assets assigned to them).
import { supabase } from '../../lib/supabase'
import type { Enums, Tables, TablesInsert } from '../../types/database'

export type AssetType = Enums<'asset_type'>
export type AssetCondition = Enums<'asset_condition'>

type PersonSummary = Pick<Tables<'profiles'>, 'id' | 'full_name' | 'email'>

export type Asset = Tables<'assets'> & { assignee: PersonSummary | null }

/** The fields the asset form can set. */
export type AssetInput = Pick<
  TablesInsert<'assets'>,
  | 'asset_tag'
  | 'serial_number'
  | 'type'
  | 'brand'
  | 'model'
  | 'condition'
  | 'assigned_to'
  | 'purchase_date'
  | 'notes'
>

const ASSET_SELECT = '*, assignee:profiles!assets_assigned_to_fkey(id, full_name, email)'

// Postgres error code for "a UNIQUE constraint was violated".
const UNIQUE_VIOLATION = '23505'

export async function listAssets(): Promise<Asset[]> {
  const { data, error } = await supabase.from('assets').select(ASSET_SELECT).order('asset_tag')
  if (error) throw error
  return data
}

export async function getAsset(id: number): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('assets')
    .select(ASSET_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createAsset(input: AssetInput): Promise<number> {
  const { data, error } = await supabase.from('assets').insert(input).select('id').single()
  if (error) throw friendlyError(error)
  return data.id
}

export async function updateAsset(id: number, input: AssetInput): Promise<void> {
  const { data, error } = await supabase.from('assets').update(input).eq('id', id).select('id')
  if (error) throw friendlyError(error)
  if (data.length === 0) throw new Error('You do not have permission to update this asset.')
}

/** Everyone an asset can be assigned to (all roles). Staff can read all profiles. */
export async function listPeople(): Promise<PersonSummary[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name')
  if (error) throw error
  return data
}

// Turn database error codes into messages a user understands.
function friendlyError(error: { code?: string; message: string }): Error {
  if (error.code === UNIQUE_VIOLATION) {
    return new Error('An asset with this asset tag or serial number already exists.')
  }
  return new Error(error.message)
}

// Pure helpers for the asset form: no React, no database. That makes every
// function here easy to unit test (see assetForm.test.ts).
import type { Asset, AssetCondition, AssetInput, AssetType } from './api'

// Limits match the CHECK constraints in 20261027000003_asset_constraints.sql.
export const ASSET_TAG_MAX = 50
export const SERIAL_MAX = 100
export const BRAND_MODEL_MAX = 100
export const NOTES_MAX = 2000

/**
 * What the form holds while the user types. Every field is a string because
 * that's what HTML inputs give us ("" means empty). We convert to the database
 * shape (nulls, trimmed text) only when saving, in toAssetInput().
 */
export type AssetFormValues = {
  asset_tag: string
  serial_number: string
  type: AssetType
  brand: string
  model: string
  condition: AssetCondition
  assigned_to: string
  purchase_date: string
  notes: string
}

export type AssetFieldErrors = Partial<Record<keyof AssetFormValues, string>>

export const EMPTY_ASSET_FORM: AssetFormValues = {
  asset_tag: '',
  serial_number: '',
  type: 'laptop',
  brand: '',
  model: '',
  condition: 'new',
  assigned_to: '',
  purchase_date: '',
  notes: '',
}

/** Today's date as YYYY-MM-DD in the user's own time zone. */
export function todayLocal(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function validateAsset(values: AssetFormValues, today = todayLocal()): AssetFieldErrors {
  const errors: AssetFieldErrors = {}
  const tag = values.asset_tag.trim()
  const serial = values.serial_number.trim()

  if (!tag) errors.asset_tag = 'Asset tag is required.'
  else if (tag.length > ASSET_TAG_MAX)
    errors.asset_tag = `Asset tag must be ${ASSET_TAG_MAX} characters or fewer.`

  if (!serial) errors.serial_number = 'Serial number is required.'
  else if (serial.length > SERIAL_MAX)
    errors.serial_number = `Serial number must be ${SERIAL_MAX} characters or fewer.`

  if (values.brand.trim().length > BRAND_MODEL_MAX)
    errors.brand = `Brand must be ${BRAND_MODEL_MAX} characters or fewer.`
  if (values.model.trim().length > BRAND_MODEL_MAX)
    errors.model = `Model must be ${BRAND_MODEL_MAX} characters or fewer.`
  if (values.notes.trim().length > NOTES_MAX)
    errors.notes = `Notes must be ${NOTES_MAX} characters or fewer.`

  // "YYYY-MM-DD" strings compare correctly as plain text, so no Date math needed.
  if (values.purchase_date && values.purchase_date > today)
    errors.purchase_date = 'Purchase date cannot be in the future.'

  return errors
}

/** Form strings -> database shape: trim text, turn empty optional fields into null. */
export function toAssetInput(values: AssetFormValues): AssetInput {
  const orNull = (s: string) => s.trim() || null
  return {
    asset_tag: values.asset_tag.trim(),
    serial_number: values.serial_number.trim(),
    type: values.type,
    brand: orNull(values.brand),
    model: orNull(values.model),
    condition: values.condition,
    assigned_to: values.assigned_to || null,
    purchase_date: values.purchase_date || null,
    notes: orNull(values.notes),
  }
}

/** Database shape -> form strings (the reverse of toAssetInput), for editing. */
export function toFormValues(asset: Asset): AssetFormValues {
  return {
    asset_tag: asset.asset_tag,
    serial_number: asset.serial_number,
    type: asset.type,
    brand: asset.brand ?? '',
    model: asset.model ?? '',
    condition: asset.condition,
    assigned_to: asset.assigned_to ?? '',
    purchase_date: asset.purchase_date ?? '',
    notes: asset.notes ?? '',
  }
}

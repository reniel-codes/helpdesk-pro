import { describe, expect, it } from 'vitest'
import { makeAsset } from '../../test/fixtures'
import {
  EMPTY_ASSET_FORM,
  toAssetInput,
  todayLocal,
  toFormValues,
  validateAsset,
  type AssetFormValues,
} from './assetForm'

const TODAY = '2026-10-27'

function form(overrides: Partial<AssetFormValues> = {}): AssetFormValues {
  return { ...EMPTY_ASSET_FORM, asset_tag: 'LAP-0001', serial_number: 'SN-1', ...overrides }
}

describe('validateAsset', () => {
  it('accepts a form with just the required fields', () => {
    expect(validateAsset(form(), TODAY)).toEqual({})
  })

  it('requires asset tag and serial number', () => {
    const errors = validateAsset(form({ asset_tag: '', serial_number: '' }), TODAY)
    expect(errors.asset_tag).toBe('Asset tag is required.')
    expect(errors.serial_number).toBe('Serial number is required.')
  })

  it.each([
    [50, undefined],
    [51, 'Asset tag must be 50 characters or fewer.'],
  ])('asset tag of %i characters -> %s', (length, expected) => {
    expect(validateAsset(form({ asset_tag: 'A'.repeat(length) }), TODAY).asset_tag).toBe(expected)
  })

  it.each([
    ['2026-10-26', undefined], // yesterday
    ['2026-10-27', undefined], // today
    ['2026-10-28', 'Purchase date cannot be in the future.'], // tomorrow
  ])('purchase date %s -> %s', (date, expected) => {
    expect(validateAsset(form({ purchase_date: date }), TODAY).purchase_date).toBe(expected)
  })

  it('allows an empty purchase date', () => {
    expect(validateAsset(form({ purchase_date: '' }), TODAY).purchase_date).toBeUndefined()
  })

  // 👉 YOUR TURN: replace `it.todo` with a real test (copy the shape of the
  // "requires asset tag and serial number" test above). Run `npm run test:watch`
  // and watch it go from "todo" to green.
  it('rejects a serial number that is only spaces', () => { expect(validateAsset(form({ serial_number: '   ' }), TODAY).serial_number).toBe('Serial number is required.') })
})

describe('toAssetInput', () => {
  it('trims text and turns empty optional fields into null', () => {
    const input = toAssetInput(
      form({ asset_tag: '  LAP-9 ', brand: '   ', model: '', assigned_to: '', notes: ' ' }),
    )
    expect(input).toMatchObject({
      asset_tag: 'LAP-9',
      brand: null,
      model: null,
      assigned_to: null,
      purchase_date: null,
      notes: null,
    })
  })

  it('round-trips with toFormValues', () => {
    const asset = makeAsset({ assigned_to: 'employee-id', notes: 'Spare charger in box' })
    const input = toAssetInput(toFormValues(asset))
    expect(input).toEqual({
      asset_tag: asset.asset_tag,
      serial_number: asset.serial_number,
      type: asset.type,
      brand: asset.brand,
      model: asset.model,
      condition: asset.condition,
      assigned_to: 'employee-id',
      purchase_date: asset.purchase_date,
      notes: 'Spare charger in box',
    })
  })
})

describe('todayLocal', () => {
  it('formats a date as YYYY-MM-DD with zero padding', () => {
    expect(todayLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

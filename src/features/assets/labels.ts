import { Constants } from '../../types/database'
import type { AssetCondition, AssetType } from './api'

export const ASSET_TYPES = Constants.public.Enums.asset_type
export const ASSET_CONDITIONS = Constants.public.Enums.asset_condition

export const TYPE_LABELS: Record<AssetType, string> = {
  laptop: 'Laptop',
  desktop: 'Desktop',
  monitor: 'Monitor',
  printer: 'Printer',
  phone: 'Phone',
  peripheral: 'Peripheral',
  other: 'Other',
}

export const CONDITION_LABELS: Record<AssetCondition, string> = {
  new: 'New',
  good: 'Good',
  fair: 'Fair',
  needs_repair: 'Needs Repair',
  retired: 'Retired',
}

export const CONDITION_COLORS: Record<AssetCondition, string> = {
  new: 'bg-green-100 text-green-800',
  good: 'bg-sky-100 text-sky-800',
  fair: 'bg-amber-100 text-amber-800',
  needs_repair: 'bg-red-100 text-red-800',
  retired: 'bg-slate-100 text-slate-500',
}

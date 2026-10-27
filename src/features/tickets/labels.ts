import { Constants } from '../../types/database'
import type { TicketCategory, TicketPriority, TicketStatus } from './api'

// The allowed values come straight from the database enums, so the dropdowns
// can never offer a value the database would reject.
export const TICKET_STATUSES = Constants.public.Enums.ticket_status
export const TICKET_PRIORITIES = Constants.public.Enums.ticket_priority
export const TICKET_CATEGORIES = Constants.public.Enums.ticket_category

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  hardware: 'Hardware',
  software: 'Software',
  network: 'Network',
  account_access: 'Account / Access',
  other: 'Other',
}

export const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-amber-100 text-amber-800',
  on_hold: 'bg-slate-200 text-slate-700',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-slate-100 text-slate-500',
}

export const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-sky-100 text-sky-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

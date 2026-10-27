import type { Asset } from '../features/assets/api'
import type { Ticket, TicketNote } from '../features/tickets/api'

export function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 5,
    asset_tag: 'LAP-0005',
    serial_number: 'SN-ABC-123',
    type: 'laptop',
    brand: 'Dell',
    model: 'Latitude 5440',
    condition: 'good',
    assigned_to: null,
    purchase_date: '2025-06-01',
    notes: null,
    created_at: '2026-10-27T01:00:00Z',
    updated_at: '2026-10-27T01:00:00Z',
    assignee: null,
    ...overrides,
  }
}

/** A fake ticket for tests. Pass overrides for the fields you care about. */
export function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 7,
    title: 'Printer is jammed',
    description: 'Paper stuck in tray 2.',
    category: 'hardware',
    priority: 'medium',
    status: 'open',
    created_by: 'employee-id',
    assigned_to: null,
    asset_id: null,
    created_at: '2026-10-27T01:00:00Z',
    updated_at: '2026-10-27T01:00:00Z',
    resolved_at: null,
    requester: { id: 'employee-id', full_name: 'Eve Employee', email: 'employee@helpdesk.test' },
    assignee: null,
    ...overrides,
  }
}

export function makeNote(overrides: Partial<TicketNote> = {}): TicketNote {
  return {
    id: 1,
    ticket_id: 7,
    author_id: 'it_staff-id',
    body: 'Looking into it.',
    is_internal: false,
    created_at: '2026-10-27T02:00:00Z',
    author: {
      id: 'it_staff-id',
      full_name: 'Sam Support',
      email: 'staff@helpdesk.test',
      role: 'it_staff',
    },
    ...overrides,
  }
}

/**
 * Row Level Security tests.
 *
 * These log in as each demo user with the PUBLIC anon key and try things the
 * permission matrix (docs/permission-matrix.md) says they must not be able to do.
 * The UI is not involved at all: this is what an attacker could try from the
 * browser console, so a pass here means the database itself is enforcing the rules.
 *
 * How Supabase reports a blocked action:
 *   - Blocked SELECT / UPDATE / DELETE -> no error, just 0 rows.
 *   - Blocked INSERT                    -> error code 42501 (RLS violation).
 *
 * All rows created here are deleted again in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { anonClient, signedInClient, type Client } from './clients.ts'

const RUN_ID = Date.now()
const RLS_VIOLATION = '42501'

let admin: Client
let staff: Client
let employee: Client
let staffId: string
let employeeId: string

// Test data, created in beforeAll.
let employeeTicketId: number
let staffTicketId: number
let assetId: number

beforeAll(async () => {
  ;({ client: admin } = await signedInClient('ADMIN'))
  ;({ client: staff, userId: staffId } = await signedInClient('STAFF'))
  ;({ client: employee, userId: employeeId } = await signedInClient('EMPLOYEE'))

  const empTicket = await employee
    .from('tickets')
    .insert({ title: `[RLS ${RUN_ID}] Employee ticket`, description: 'test', created_by: employeeId })
    .select('id')
    .single()
  if (empTicket.error) throw new Error(`Setup: employee ticket: ${empTicket.error.message}`)
  employeeTicketId = empTicket.data.id

  const staffTicket = await staff
    .from('tickets')
    .insert({ title: `[RLS ${RUN_ID}] Staff ticket`, description: 'test', created_by: staffId })
    .select('id')
    .single()
  if (staffTicket.error) throw new Error(`Setup: staff ticket: ${staffTicket.error.message}`)
  staffTicketId = staffTicket.data.id

  const notes = await staff.from('ticket_notes').insert([
    { ticket_id: employeeTicketId, author_id: staffId, body: 'Public reply', is_internal: false },
    { ticket_id: employeeTicketId, author_id: staffId, body: 'Internal note', is_internal: true },
  ])
  if (notes.error) throw new Error(`Setup: notes: ${notes.error.message}`)

  const asset = await staff
    .from('assets')
    .insert({
      asset_tag: `RLS-${RUN_ID}`,
      serial_number: `RLS-SN-${RUN_ID}`,
      type: 'laptop',
      assigned_to: staffId,
    })
    .select('id')
    .single()
  if (asset.error) throw new Error(`Setup: asset: ${asset.error.message}`)
  assetId = asset.data.id
})

afterAll(async () => {
  // Admin is the only role allowed to delete. Notes are removed by ON DELETE CASCADE.
  if (admin) {
    await admin.from('tickets').delete().like('title', `[RLS ${RUN_ID}]%`)
    await admin.from('assets').delete().like('asset_tag', `RLS-${RUN_ID}%`)
  }
})

describe('anonymous (logged-out) visitors', () => {
  it('cannot read any tickets, profiles, notes, or assets', async () => {
    const anon = anonClient()
    for (const table of ['tickets', 'profiles', 'ticket_notes', 'assets'] as const) {
      const { data, error } = await anon.from(table).select('id')
      expect(error).toBeNull()
      expect(data, `anon read ${table}`).toEqual([])
    }
  })
})

describe('profiles', () => {
  it('employee cannot promote themselves to admin', async () => {
    const { data } = await employee
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', employeeId)
      .select()
    expect(data).toEqual([])

    const { data: me } = await admin.from('profiles').select('role').eq('id', employeeId).single()
    expect(me?.role).toBe('employee')
  })

  it('IT staff cannot promote themselves to admin', async () => {
    const { data } = await staff.from('profiles').update({ role: 'admin' }).eq('id', staffId).select()
    expect(data).toEqual([])
  })

  it('employee cannot edit someone else’s profile', async () => {
    const { data } = await employee
      .from('profiles')
      .update({ full_name: 'Hacked' })
      .eq('id', staffId)
      .select()
    expect(data).toEqual([])
  })

  it('employee sees only their own profile and staff/admin profiles', async () => {
    const { data } = await employee.from('profiles').select('id, role')
    expect(data?.length).toBeGreaterThan(0)
    for (const p of data ?? []) {
      expect(p.id === employeeId || p.role !== 'employee').toBe(true)
    }
  })

  it('admin can update another user’s profile', async () => {
    const { data: before } = await admin
      .from('profiles')
      .select('department')
      .eq('id', employeeId)
      .single()

    const { data } = await admin
      .from('profiles')
      .update({ department: `RLS ${RUN_ID}` })
      .eq('id', employeeId)
      .select('department')
    expect(data).toEqual([{ department: `RLS ${RUN_ID}` }])

    // Put it back the way it was.
    await admin.from('profiles').update({ department: before?.department ?? null }).eq('id', employeeId)
  })
})

describe('tickets', () => {
  it('employee sees their own ticket', async () => {
    const { data } = await employee.from('tickets').select('id').eq('id', employeeTicketId)
    expect(data).toHaveLength(1)
  })

  it('employee cannot see a ticket created by someone else', async () => {
    const { data } = await employee.from('tickets').select('id').eq('id', staffTicketId)
    expect(data).toEqual([])
  })

  it('IT staff can see every ticket', async () => {
    const { data } = await staff
      .from('tickets')
      .select('id')
      .in('id', [employeeTicketId, staffTicketId])
    expect(data).toHaveLength(2)
  })

  it('employee cannot create a ticket on behalf of another user', async () => {
    const { error } = await employee
      .from('tickets')
      .insert({ title: `[RLS ${RUN_ID}] Spoofed`, description: 'x', created_by: staffId })
    expect(error?.code).toBe(RLS_VIOLATION)
  })

  it('employee cannot create a ticket that is already in progress', async () => {
    const { error } = await employee.from('tickets').insert({
      title: `[RLS ${RUN_ID}] Skip queue`,
      description: 'x',
      created_by: employeeId,
      status: 'in_progress',
    })
    expect(error?.code).toBe(RLS_VIOLATION)
  })

  it('employee cannot assign their own ticket', async () => {
    const { error } = await employee.from('tickets').insert({
      title: `[RLS ${RUN_ID}] Self-assign`,
      description: 'x',
      created_by: employeeId,
      assigned_to: staffId,
    })
    expect(error?.code).toBe(RLS_VIOLATION)
  })

  it('employee cannot change the status or priority of their own ticket', async () => {
    const { data } = await employee
      .from('tickets')
      .update({ status: 'closed', priority: 'critical' })
      .eq('id', employeeTicketId)
      .select()
    expect(data).toEqual([])
  })

  it('IT staff can resolve a ticket, and resolved_at is set automatically', async () => {
    const { data, error } = await staff
      .from('tickets')
      .update({ status: 'resolved', assigned_to: staffId })
      .eq('id', employeeTicketId)
      .select('status, resolved_at')
      .single()
    expect(error).toBeNull()
    expect(data?.status).toBe('resolved')
    expect(data?.resolved_at).not.toBeNull()
  })

  it('reopening a ticket clears resolved_at', async () => {
    const { data } = await staff
      .from('tickets')
      .update({ status: 'in_progress' })
      .eq('id', employeeTicketId)
      .select('resolved_at')
      .single()
    expect(data?.resolved_at).toBeNull()
  })

  it('a ticket cannot be assigned to an employee', async () => {
    const { error } = await staff
      .from('tickets')
      .update({ assigned_to: employeeId })
      .eq('id', employeeTicketId)
    expect(error?.message).toContain('can only be assigned to IT staff or admins')
  })

  it('rejects a title shorter than 5 characters', async () => {
    const { error } = await employee
      .from('tickets')
      .insert({ title: 'Hi', description: 'x', created_by: employeeId })
    expect(error?.code).toBe('23514') // check_violation
  })

  it('IT staff cannot delete tickets', async () => {
    const { data } = await staff.from('tickets').delete().eq('id', staffTicketId).select()
    expect(data).toEqual([])

    const { data: stillThere } = await admin.from('tickets').select('id').eq('id', staffTicketId)
    expect(stillThere).toHaveLength(1)
  })

  it('employee cannot delete their own ticket', async () => {
    const { data } = await employee.from('tickets').delete().eq('id', employeeTicketId).select()
    expect(data).toEqual([])
  })
})

describe('ticket notes', () => {
  it('employee sees public notes but not internal notes on their ticket', async () => {
    const { data } = await employee
      .from('ticket_notes')
      .select('body')
      .eq('ticket_id', employeeTicketId)
    expect(data?.map((n) => n.body)).toEqual(['Public reply'])
  })

  it('IT staff see both public and internal notes', async () => {
    const { data } = await staff.from('ticket_notes').select('id').eq('ticket_id', employeeTicketId)
    expect(data).toHaveLength(2)
  })

  it('employee can add a public note to their own ticket', async () => {
    const { error } = await employee
      .from('ticket_notes')
      .insert({ ticket_id: employeeTicketId, author_id: employeeId, body: 'Thanks!' })
    expect(error).toBeNull()
  })

  it('employee cannot add an internal note', async () => {
    const { error } = await employee.from('ticket_notes').insert({
      ticket_id: employeeTicketId,
      author_id: employeeId,
      body: 'Sneaky',
      is_internal: true,
    })
    expect(error?.code).toBe(RLS_VIOLATION)
  })

  it('employee cannot add a note to someone else’s ticket', async () => {
    const { error } = await employee
      .from('ticket_notes')
      .insert({ ticket_id: staffTicketId, author_id: employeeId, body: 'Hello' })
    expect(error?.code).toBe(RLS_VIOLATION)
  })

  it('employee cannot post a note pretending to be someone else', async () => {
    const { error } = await employee
      .from('ticket_notes')
      .insert({ ticket_id: employeeTicketId, author_id: staffId, body: 'Fake staff reply' })
    expect(error?.code).toBe(RLS_VIOLATION)
  })

  it('notes cannot be edited, even by admins', async () => {
    const { data } = await admin
      .from('ticket_notes')
      .update({ body: 'Rewritten history' })
      .eq('ticket_id', employeeTicketId)
      .select()
    expect(data).toEqual([])
  })
})

describe('assets', () => {
  it('employee cannot see an asset that is not assigned to them', async () => {
    const { data } = await employee.from('assets').select('id').eq('id', assetId)
    expect(data).toEqual([])
  })

  it('employee cannot create an asset', async () => {
    const { error } = await employee
      .from('assets')
      .insert({ asset_tag: `RLS-${RUN_ID}-E`, serial_number: `RLS-SN-${RUN_ID}-E`, type: 'phone' })
    expect(error?.code).toBe(RLS_VIOLATION)
  })

  it('employee cannot reassign an asset to themselves', async () => {
    const { data } = await employee
      .from('assets')
      .update({ assigned_to: employeeId })
      .eq('id', assetId)
      .select()
    expect(data).toEqual([])
  })

  it('employee sees an asset once it is assigned to them', async () => {
    await staff.from('assets').update({ assigned_to: employeeId }).eq('id', assetId)
    const { data } = await employee.from('assets').select('id').eq('id', assetId)
    expect(data).toHaveLength(1)
  })

  it('IT staff cannot delete assets', async () => {
    const { data } = await staff.from('assets').delete().eq('id', assetId).select()
    expect(data).toEqual([])
  })

  it('admin can delete assets', async () => {
    const { data } = await admin.from('assets').delete().eq('id', assetId).select('id')
    expect(data).toEqual([{ id: assetId }])
  })
})


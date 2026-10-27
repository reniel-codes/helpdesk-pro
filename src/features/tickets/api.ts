// All ticket-related database calls live here, so pages never talk to Supabase
// directly. That keeps pages simple and lets tests swap this file for a fake.
//
// We never filter by role here: RLS in the database already limits each user
// to the rows they may see. Employees simply get fewer rows back.
import { supabase } from '../../lib/supabase'
import type { Enums, Tables, TablesUpdate } from '../../types/database'

export type TicketStatus = Enums<'ticket_status'>
export type TicketPriority = Enums<'ticket_priority'>
export type TicketCategory = Enums<'ticket_category'>

type PersonSummary = Pick<Tables<'profiles'>, 'id' | 'full_name' | 'email'>

export type Ticket = Tables<'tickets'> & {
  requester: PersonSummary | null
  assignee: PersonSummary | null
}

export type TicketNote = Tables<'ticket_notes'> & {
  author: (PersonSummary & Pick<Tables<'profiles'>, 'role'>) | null
}

export type StaffMember = Pick<Tables<'profiles'>, 'id' | 'full_name' | 'email'>

export type NewTicketInput = {
  title: string
  description: string
  category: TicketCategory
  priority: TicketPriority
}

export type TicketUpdate = Pick<TablesUpdate<'tickets'>, 'status' | 'priority' | 'assigned_to'>

// "requester:profiles!tickets_created_by_fkey(...)" means: follow the created_by
// foreign key to profiles and return it under the name "requester".
const TICKET_SELECT = `
  *,
  requester:profiles!tickets_created_by_fkey(id, full_name, email),
  assignee:profiles!tickets_assigned_to_fkey(id, full_name, email)
`

export async function listTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from('tickets')
    .select(TICKET_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

/** Returns null when the ticket doesn't exist OR the user isn't allowed to see it. */
export async function getTicket(id: number): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from('tickets')
    .select(TICKET_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createTicket(input: NewTicketInput, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('tickets')
    .insert({ ...input, created_by: userId })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function updateTicket(id: number, changes: TicketUpdate): Promise<void> {
  // .select() makes Supabase return the updated row. If RLS blocked the update
  // we get zero rows back instead of an error, so we check for that ourselves.
  const { data, error } = await supabase.from('tickets').update(changes).eq('id', id).select('id')
  if (error) throw error
  if (data.length === 0) throw new Error('You do not have permission to update this ticket.')
}

export async function listNotes(ticketId: number): Promise<TicketNote[]> {
  const { data, error } = await supabase
    .from('ticket_notes')
    .select('*, author:profiles!ticket_notes_author_id_fkey(id, full_name, email, role)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function addNote(
  ticketId: number,
  authorId: string,
  body: string,
  isInternal: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('ticket_notes')
    .insert({ ticket_id: ticketId, author_id: authorId, body, is_internal: isInternal })
  if (error) throw error
}

/** People a ticket can be assigned to. */
export async function listStaff(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('role', ['admin', 'it_staff'])
    .order('full_name')
  if (error) throw error
  return data
}

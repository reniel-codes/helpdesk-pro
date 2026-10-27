import { useState, type FormEvent } from 'react'
import { inputClass, labelClass, primaryButtonClass } from '../../components/formStyles'
import { ErrorMessage } from '../../components/StatusMessage'
import { errorMessage, useQuery } from '../../lib/useQuery'
import { listStaff, updateTicket, type Ticket, type TicketPriority, type TicketStatus } from './api'
import { PRIORITY_LABELS, STATUS_LABELS, TICKET_PRIORITIES, TICKET_STATUSES } from './labels'

type Props = { ticket: Ticket; onSaved: () => void }

/** Status / priority / assignee editor. Only rendered for IT staff and admins. */
export function StaffControls({ ticket, onSaved }: Props) {
  const { data: staff, error: staffError } = useQuery('staff', listStaff)

  const [status, setStatus] = useState<TicketStatus>(ticket.status)
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority)
  const [assignedTo, setAssignedTo] = useState(ticket.assigned_to ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changed =
    status !== ticket.status ||
    priority !== ticket.priority ||
    assignedTo !== (ticket.assigned_to ?? '')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await updateTicket(ticket.id, { status, priority, assigned_to: assignedTo || null })
      onSaved()
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Manage</h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && <ErrorMessage message={error} />}
        {staffError && <ErrorMessage message={`Could not load staff list: ${staffError}`} />}

        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TicketStatus)}
            className={inputClass}
          >
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="priority" className={labelClass}>
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className={inputClass}
          >
            {TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="assignee" className={labelClass}>
            Assigned to
          </label>
          <select
            id="assignee"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className={inputClass}
          >
            <option value="">Unassigned</option>
            {staff?.map((person) => (
              <option key={person.id} value={person.id}>
                {person.full_name || person.email}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={!changed || saving} className={`w-full ${primaryButtonClass}`}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </section>
  )
}

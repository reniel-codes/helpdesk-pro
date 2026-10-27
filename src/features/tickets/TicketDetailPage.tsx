import { Link, useParams } from 'react-router'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage'
import { useQuery } from '../../lib/useQuery'
import { formatDateTime } from '../../utils/formatDate'
import { useAuth } from '../auth/AuthContext'
import { getTicket } from './api'
import { CATEGORY_LABELS } from './labels'
import { NotesSection } from './NotesSection'
import { StaffControls } from './StaffControls'
import { PriorityBadge, StatusBadge } from './TicketBadges'

export function TicketDetailPage() {
  const { id: idParam } = useParams()
  const id = Number(idParam)
  const validId = Number.isInteger(id) && id > 0

  const { profile } = useAuth()
  const isStaff = profile?.role === 'admin' || profile?.role === 'it_staff'

  const {
    data: ticket,
    error,
    loading,
    reload,
  } = useQuery(`ticket:${idParam}`, () => (validId ? getTicket(id) : Promise.resolve(null)))

  if (error) return <ErrorMessage message={error} onRetry={reload} />
  if (loading && !ticket) return <LoadingMessage label="Loading ticket…" />

  // RLS returns nothing for tickets you may not see, so "doesn't exist" and
  // "not yours" look identical. That's deliberate: we don't reveal which
  // ticket numbers exist to people who can't open them.
  if (!ticket) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Ticket not found</h1>
        <p className="mt-2 text-slate-600">
          It may not exist, or you may not have permission to view it.
        </p>
        <Link to="/tickets" className="mt-4 inline-block text-blue-600 hover:underline">
          Back to tickets
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/tickets" className="text-sm text-blue-600 hover:underline">
        ← Back to tickets
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">Ticket #{ticket.id}</p>
            <h1 className="mt-1 text-2xl font-bold break-words text-slate-900">{ticket.title}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
            {/* whitespace-pre-wrap keeps the line breaks the user typed. */}
            <p className="mt-5 whitespace-pre-wrap break-words text-slate-700">
              {ticket.description}
            </p>
          </section>

          <NotesSection ticketId={ticket.id} />
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Details
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Detail label="Category" value={CATEGORY_LABELS[ticket.category]} />
              <Detail label="Requester" value={nameOf(ticket.requester) ?? '—'} />
              <Detail label="Assigned to" value={nameOf(ticket.assignee) ?? 'Unassigned'} />
              <Detail label="Created" value={formatDateTime(ticket.created_at)} />
              <Detail label="Last updated" value={formatDateTime(ticket.updated_at)} />
              {ticket.resolved_at && (
                <Detail label="Resolved" value={formatDateTime(ticket.resolved_at)} />
              )}
            </dl>
          </section>

          {/* key: when the ticket changes after saving, the form starts fresh
              from the new values instead of keeping stale ones. */}
          {isStaff && <StaffControls key={ticket.updated_at} ticket={ticket} onSaved={reload} />}
        </aside>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value}</dd>
    </div>
  )
}

function nameOf(person: { full_name: string; email: string } | null): string | null {
  return person ? person.full_name || person.email : null
}

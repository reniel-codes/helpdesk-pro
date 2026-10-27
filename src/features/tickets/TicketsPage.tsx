import { Link } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage'
import { useQuery } from '../../lib/useQuery'
import { formatDateTime } from '../../utils/formatDate'
import { useAuth } from '../auth/AuthContext'
import { listTickets } from './api'
import { CATEGORY_LABELS } from './labels'
import { PriorityBadge, StatusBadge } from './TicketBadges'

export function TicketsPage() {
  const { profile } = useAuth()
  const isEmployee = profile?.role === 'employee'
  const { data: tickets, error, loading, reload } = useQuery('tickets', listTickets)

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={isEmployee ? 'My Tickets' : 'Tickets'}
          description={
            isEmployee ? 'Problems you have reported to IT.' : 'All support requests.'
          }
        />
        <Link
          to="/tickets/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          New ticket
        </Link>
      </div>

      {error && <ErrorMessage message={error} onRetry={reload} />}
      {loading && !tickets && <LoadingMessage label="Loading tickets…" />}

      {tickets && tickets.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-900">No tickets yet</p>
          <p className="mt-1 text-sm text-slate-600">
            {isEmployee
              ? 'Having a problem with your computer or account? Create a ticket.'
              : 'New requests will appear here.'}
          </p>
        </div>
      )}

      {tickets && tickets.length > 0 && (
        // overflow-x-auto: on narrow screens the table scrolls sideways inside
        // its box instead of breaking the page layout.
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-600 uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">#</th>
                <th scope="col" className="px-4 py-3">Title</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Priority</th>
                <th scope="col" className="px-4 py-3">Category</th>
                {!isEmployee && <th scope="col" className="px-4 py-3">Requester</th>}
                <th scope="col" className="px-4 py-3">Assigned to</th>
                <th scope="col" className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{ticket.id}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{CATEGORY_LABELS[ticket.category]}</td>
                  {!isEmployee && (
                    <td className="px-4 py-3 text-slate-600">{personName(ticket.requester)}</td>
                  )}
                  <td className="px-4 py-3 text-slate-600">
                    {ticket.assignee ? personName(ticket.assignee) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                    {formatDateTime(ticket.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function personName(person: { full_name: string; email: string } | null): string {
  if (!person) return '—'
  return person.full_name || person.email
}

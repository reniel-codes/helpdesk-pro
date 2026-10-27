import { useState, type FormEvent } from 'react'
import { Badge } from '../../components/Badge'
import { errorTextClass, inputClass, primaryButtonClass } from '../../components/formStyles'
import { ErrorMessage, LoadingMessage } from '../../components/StatusMessage'
import { ROLE_LABELS } from '../../components/layout/navItems'
import { errorMessage, useQuery } from '../../lib/useQuery'
import { formatDateTime } from '../../utils/formatDate'
import { useAuth } from '../auth/AuthContext'
import { addNote, listNotes } from './api'
import { NOTE_MAX, validateNote } from './validateTicket'

/** Troubleshooting notes and replies. Employees only ever receive public notes (RLS). */
export function NotesSection({ ticketId }: { ticketId: number }) {
  const { profile } = useAuth()
  const isStaff = profile?.role === 'admin' || profile?.role === 'it_staff'
  const { data: notes, error, loading, reload } = useQuery(`notes:${ticketId}`, () =>
    listNotes(ticketId),
  )

  const [body, setBody] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return
    setSubmitError(null)

    const problem = validateNote(body)
    setFieldError(problem)
    if (problem) return

    setSubmitting(true)
    try {
      await addNote(ticketId, profile.id, body.trim(), isStaff && isInternal)
      setBody('')
      setIsInternal(false)
      reload()
    } catch (err) {
      setSubmitError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Notes</h2>

      {error && <ErrorMessage message={error} onRetry={reload} />}
      {loading && !notes && <LoadingMessage label="Loading notes…" />}

      {notes && notes.length === 0 && (
        <p className="mt-3 text-sm text-slate-500">No notes yet.</p>
      )}

      {notes && notes.length > 0 && (
        <ol className="mt-4 space-y-4">
          {notes.map((note) => (
            <li
              key={note.id}
              className={`rounded-md border p-4 ${
                note.is_internal ? 'border-amber-200 bg-amber-50' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-slate-900">
                  {note.author ? note.author.full_name || note.author.email : 'Unknown user'}
                </span>
                {note.author && (
                  <span className="text-slate-500">· {ROLE_LABELS[note.author.role]}</span>
                )}
                {note.is_internal && (
                  <Badge className="bg-amber-200 text-amber-900">Internal</Badge>
                )}
                <span className="ml-auto text-xs text-slate-500">
                  {formatDateTime(note.created_at)}
                </span>
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap break-words text-slate-700">
                {note.body}
              </p>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3">
        {submitError && <ErrorMessage message={submitError} />}
        <label htmlFor="note-body" className="sr-only">
          Add a note
        </label>
        <textarea
          id="note-body"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={NOTE_MAX}
          placeholder={isStaff ? 'Add a troubleshooting note or reply…' : 'Add a reply…'}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? 'note-error' : undefined}
          className={inputClass}
        />
        {fieldError && (
          <p id="note-error" className={errorTextClass}>
            {fieldError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {isStaff ? (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Internal note (hidden from the requester)
            </label>
          ) : (
            <span />
          )}
          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? 'Adding…' : 'Add note'}
          </button>
        </div>
      </form>
    </section>
  )
}

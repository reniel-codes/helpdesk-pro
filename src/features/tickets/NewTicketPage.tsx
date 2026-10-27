import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  errorTextClass,
  inputClass,
  labelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from '../../components/formStyles'
import { PageHeader } from '../../components/PageHeader'
import { ErrorMessage } from '../../components/StatusMessage'
import { errorMessage } from '../../lib/useQuery'
import { useAuth } from '../auth/AuthContext'
import { createTicket, type TicketCategory, type TicketPriority } from './api'
import { CATEGORY_LABELS, PRIORITY_LABELS, TICKET_CATEGORIES, TICKET_PRIORITIES } from './labels'
import { TITLE_MAX, validateTicket, type TicketFieldErrors } from './validateTicket'

export function NewTicketPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TicketCategory>('hardware')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [fieldErrors, setFieldErrors] = useState<TicketFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return
    setFormError(null)

    const errors = validateTicket(title, description)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSubmitting(true)
    try {
      const id = await createTicket(
        { title: title.trim(), description: description.trim(), category, priority },
        profile.id,
      )
      navigate(`/tickets/${id}`)
    } catch (err) {
      setFormError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="New ticket" description="Describe the problem so IT can help you." />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-lg border border-slate-200 bg-white p-6"
      >
        {formError && <ErrorMessage message={formError} />}

        <div>
          <label htmlFor="title" className={labelClass}>
            Title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="e.g. Laptop won't connect to Wi-Fi"
            aria-invalid={!!fieldErrors.title}
            aria-describedby={fieldErrors.title ? 'title-error' : undefined}
            className={inputClass}
          />
          {fieldErrors.title && (
            <p id="title-error" className={errorTextClass}>
              {fieldErrors.title}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="description" className={labelClass}>
            Description
          </label>
          <textarea
            id="description"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened? When did it start? Any error messages?"
            aria-invalid={!!fieldErrors.description}
            aria-describedby={fieldErrors.description ? 'description-error' : undefined}
            className={inputClass}
          />
          {fieldErrors.description && (
            <p id="description-error" className={errorTextClass}>
              {fieldErrors.description}
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="category" className={labelClass}>
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TicketCategory)}
              className={inputClass}
            >
              {TICKET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
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
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className={primaryButtonClass}>
            {submitting ? 'Creating…' : 'Create ticket'}
          </button>
          <Link to="/tickets" className={secondaryButtonClass}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

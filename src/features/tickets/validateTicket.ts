// These limits match the CHECK constraints in the database migration. The
// database is the final guard; checking here just gives friendlier messages.
export const TITLE_MIN = 5
export const TITLE_MAX = 120
export const DESCRIPTION_MAX = 5000
export const NOTE_MAX = 5000

export type TicketFieldErrors = { title?: string; description?: string }

export function validateTicket(title: string, description: string): TicketFieldErrors {
  const errors: TicketFieldErrors = {}
  const t = title.trim()
  const d = description.trim()

  if (!t) errors.title = 'Title is required.'
  else if (t.length < TITLE_MIN) errors.title = `Title must be at least ${TITLE_MIN} characters.`
  else if (t.length > TITLE_MAX) errors.title = `Title must be ${TITLE_MAX} characters or fewer.`

  if (!d) errors.description = 'Description is required.'
  else if (d.length > DESCRIPTION_MAX)
    errors.description = `Description must be ${DESCRIPTION_MAX} characters or fewer.`

  return errors
}

export function validateNote(body: string): string | null {
  const b = body.trim()
  if (!b) return 'Note cannot be empty.'
  if (b.length > NOTE_MAX) return `Note must be ${NOTE_MAX} characters or fewer.`
  return null
}

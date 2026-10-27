import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loggedInAs, renderWithAuth } from '../../test/renderWithAuth'
import * as api from './api'
import { NewTicketPage } from './NewTicketPage'

vi.mock('./api', () => ({ createTicket: vi.fn() }))
const createTicket = vi.mocked(api.createTicket)

beforeEach(() => {
  vi.resetAllMocks()
})

function renderPage() {
  return renderWithAuth(
    <Routes>
      <Route path="/tickets/new" element={<NewTicketPage />} />
      <Route path="/tickets/:id" element={<p>Ticket detail page</p>} />
    </Routes>,
    { auth: loggedInAs('employee'), route: '/tickets/new' },
  )
}

describe('NewTicketPage', () => {
  it('shows errors and does not submit when required fields are empty', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Create ticket' }))

    expect(screen.getByText('Title is required.')).toBeInTheDocument()
    expect(screen.getByText('Description is required.')).toBeInTheDocument()
    expect(createTicket).not.toHaveBeenCalled()
  })

  it('rejects a title that is too short', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Title'), 'Help')
    await user.type(screen.getByLabelText('Description'), 'Something broke')
    await user.click(screen.getByRole('button', { name: 'Create ticket' }))

    expect(screen.getByText('Title must be at least 5 characters.')).toBeInTheDocument()
    expect(createTicket).not.toHaveBeenCalled()
  })

  it('creates the ticket as the logged-in user and opens it', async () => {
    const user = userEvent.setup()
    createTicket.mockResolvedValue(42)
    renderPage()

    await user.type(screen.getByLabelText('Title'), '  Outlook keeps crashing  ')
    await user.type(screen.getByLabelText('Description'), 'Crashes when opening attachments.')
    await user.selectOptions(screen.getByLabelText('Category'), 'software')
    await user.selectOptions(screen.getByLabelText('Priority'), 'high')
    await user.click(screen.getByRole('button', { name: 'Create ticket' }))

    expect(createTicket).toHaveBeenCalledWith(
      {
        title: 'Outlook keeps crashing',
        description: 'Crashes when opening attachments.',
        category: 'software',
        priority: 'high',
      },
      'employee-id',
    )
    expect(await screen.findByText('Ticket detail page')).toBeInTheDocument()
  })

  it('shows the server error and lets the user try again', async () => {
    const user = userEvent.setup()
    createTicket.mockRejectedValue(new Error('new row violates row-level security policy'))
    renderPage()

    await user.type(screen.getByLabelText('Title'), 'Outlook keeps crashing')
    await user.type(screen.getByLabelText('Description'), 'Details')
    await user.click(screen.getByRole('button', { name: 'Create ticket' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('row-level security')
    expect(screen.getByRole('button', { name: 'Create ticket' })).toBeEnabled()
  })
})

import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Role } from '../auth/AuthContext'
import { makeNote, makeTicket } from '../../test/fixtures'
import { loggedInAs, renderWithAuth } from '../../test/renderWithAuth'
import * as api from './api'
import { TicketDetailPage } from './TicketDetailPage'

vi.mock('./api', () => ({
  getTicket: vi.fn(),
  updateTicket: vi.fn(),
  listNotes: vi.fn(),
  addNote: vi.fn(),
  listStaff: vi.fn(),
}))
const mocked = vi.mocked(api)

beforeEach(() => {
  vi.resetAllMocks()
  mocked.getTicket.mockResolvedValue(makeTicket())
  mocked.listNotes.mockResolvedValue([makeNote()])
  mocked.listStaff.mockResolvedValue([
    { id: 'it_staff-id', full_name: 'Sam Support', email: 'staff@helpdesk.test' },
  ])
  mocked.updateTicket.mockResolvedValue()
  mocked.addNote.mockResolvedValue()
})

function renderAs(role: Role, route = '/tickets/7') {
  return renderWithAuth(
    <Routes>
      <Route path="/tickets/:id" element={<TicketDetailPage />} />
    </Routes>,
    { auth: loggedInAs(role), route },
  )
}

describe('TicketDetailPage', () => {
  it('shows the ticket details and notes', async () => {
    renderAs('employee')

    expect(await screen.findByRole('heading', { name: 'Printer is jammed' })).toBeInTheDocument()
    expect(screen.getByText('Paper stuck in tray 2.')).toBeInTheDocument()
    expect(await screen.findByText('Looking into it.')).toBeInTheDocument()
    expect(mocked.getTicket).toHaveBeenCalledWith(7)
  })

  it('shows "not found" when the ticket is missing or not visible to the user', async () => {
    mocked.getTicket.mockResolvedValue(null)
    renderAs('employee')
    expect(await screen.findByRole('heading', { name: 'Ticket not found' })).toBeInTheDocument()
  })

  it('shows "not found" without calling the server for an invalid id', async () => {
    renderAs('employee', '/tickets/abc')
    expect(await screen.findByRole('heading', { name: 'Ticket not found' })).toBeInTheDocument()
    expect(mocked.getTicket).not.toHaveBeenCalled()
  })

  describe('as an employee', () => {
    it('hides the staff controls', async () => {
      renderAs('employee')
      await screen.findByRole('heading', { name: 'Printer is jammed' })
      expect(screen.queryByRole('heading', { name: 'Manage' })).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Status')).not.toBeInTheDocument()
    })

    it('can add a public reply but has no internal-note option', async () => {
      const user = userEvent.setup()
      renderAs('employee')

      await user.type(await screen.findByLabelText('Add a note'), 'It happened again')
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Add note' }))

      expect(mocked.addNote).toHaveBeenCalledWith(7, 'employee-id', 'It happened again', false)
    })
  })

  describe('as IT staff', () => {
    it('updates status, priority, and assignee', async () => {
      const user = userEvent.setup()
      renderAs('it_staff')

      const saveButton = await screen.findByRole('button', { name: 'Save changes' })
      expect(saveButton).toBeDisabled() // nothing changed yet

      await user.selectOptions(screen.getByLabelText('Status'), 'in_progress')
      await user.selectOptions(screen.getByLabelText('Priority'), 'high')
      await screen.findByRole('option', { name: 'Sam Support' })
      await user.selectOptions(screen.getByLabelText('Assigned to'), 'it_staff-id')
      await user.click(saveButton)

      expect(mocked.updateTicket).toHaveBeenCalledWith(7, {
        status: 'in_progress',
        priority: 'high',
        assigned_to: 'it_staff-id',
      })
      // The page reloads the ticket so it shows the saved values.
      expect(mocked.getTicket).toHaveBeenCalledTimes(2)
    })

    it('shows an error if the update fails', async () => {
      const user = userEvent.setup()
      mocked.updateTicket.mockRejectedValue(
        new Error('Tickets can only be assigned to IT staff or admins'),
      )
      renderAs('it_staff')

      await user.selectOptions(await screen.findByLabelText('Status'), 'resolved')
      await user.click(screen.getByRole('button', { name: 'Save changes' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('can only be assigned')
    })

    it('can add an internal note', async () => {
      const user = userEvent.setup()
      renderAs('it_staff')

      await user.type(await screen.findByLabelText('Add a note'), 'Replaced fuser unit')
      await user.click(screen.getByRole('checkbox', { name: /internal note/i }))
      await user.click(screen.getByRole('button', { name: 'Add note' }))

      expect(mocked.addNote).toHaveBeenCalledWith(7, 'it_staff-id', 'Replaced fuser unit', true)
      expect(mocked.listNotes).toHaveBeenCalledTimes(2) // notes refreshed
    })

    it('marks internal notes with a badge', async () => {
      mocked.listNotes.mockResolvedValue([makeNote({ is_internal: true, body: 'Staff only' })])
      renderAs('it_staff')

      expect(await screen.findByText('Staff only')).toBeInTheDocument()
      expect(screen.getByText('Internal')).toBeInTheDocument()
    })

    it('does not submit an empty note', async () => {
      const user = userEvent.setup()
      renderAs('it_staff')

      await user.click(await screen.findByRole('button', { name: 'Add note' }))

      expect(screen.getByText('Note cannot be empty.')).toBeInTheDocument()
      expect(mocked.addNote).not.toHaveBeenCalled()
    })
  })
})

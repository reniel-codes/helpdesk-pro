import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTicket } from '../../test/fixtures'
import { loggedInAs, renderWithAuth } from '../../test/renderWithAuth'
import * as api from './api'
import { TicketsPage } from './TicketsPage'

// Replace the real database calls with fakes we control in each test.
vi.mock('./api', () => ({ listTickets: vi.fn() }))
const listTickets = vi.mocked(api.listTickets)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('TicketsPage', () => {
  it('lists tickets with badges and a link to each one', async () => {
    listTickets.mockResolvedValue([
      makeTicket({ id: 1, title: 'VPN keeps dropping', status: 'in_progress', priority: 'high' }),
      makeTicket({ id: 2, title: 'Need new mouse' }),
    ])
    renderWithAuth(<TicketsPage />, { auth: loggedInAs('it_staff') })

    const link = await screen.findByRole('link', { name: 'VPN keeps dropping' })
    expect(link).toHaveAttribute('href', '/tickets/1')
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Need new mouse' })).toBeInTheDocument()
  })

  it('shows staff a Requester column', async () => {
    listTickets.mockResolvedValue([makeTicket()])
    renderWithAuth(<TicketsPage />, { auth: loggedInAs('it_staff') })

    expect(await screen.findByRole('columnheader', { name: 'Requester' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tickets' })).toBeInTheDocument()
  })

  it('shows employees "My Tickets" without a Requester column', async () => {
    listTickets.mockResolvedValue([makeTicket()])
    renderWithAuth(<TicketsPage />, { auth: loggedInAs('employee') })

    expect(await screen.findByRole('heading', { name: 'My Tickets' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Requester' })).not.toBeInTheDocument()
  })

  it('shows "Unassigned" when nobody is assigned', async () => {
    listTickets.mockResolvedValue([makeTicket({ assignee: null })])
    renderWithAuth(<TicketsPage />, { auth: loggedInAs('employee') })
    expect(await screen.findByText('Unassigned')).toBeInTheDocument()
  })

  it('shows an empty state when there are no tickets', async () => {
    listTickets.mockResolvedValue([])
    renderWithAuth(<TicketsPage />, { auth: loggedInAs('employee') })
    expect(await screen.findByText('No tickets yet')).toBeInTheDocument()
  })

  it('shows an error with a working retry button', async () => {
    const user = userEvent.setup()
    listTickets.mockRejectedValueOnce(new Error('Network down'))
    listTickets.mockResolvedValueOnce([makeTicket({ title: 'Recovered ticket' })])
    renderWithAuth(<TicketsPage />, { auth: loggedInAs('employee') })

    expect(await screen.findByRole('alert')).toHaveTextContent('Network down')
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByText('Recovered ticket')).toBeInTheDocument()
    expect(listTickets).toHaveBeenCalledTimes(2)
  })
})

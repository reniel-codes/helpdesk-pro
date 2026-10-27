import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { loggedInAs, renderWithAuth } from '../../test/renderWithAuth'
import { AppLayout } from './AppLayout'

function navLinkNames() {
  const nav = screen.getByRole('navigation', { name: 'Main' })
  return within(nav)
    .getAllByRole('link')
    .map((link) => link.textContent)
}

describe('AppLayout navigation', () => {
  it('shows all links, including Users, to an admin', () => {
    renderWithAuth(<AppLayout />, { auth: loggedInAs('admin') })
    expect(navLinkNames()).toEqual(['Dashboard', 'Tickets', 'Assets', 'Users'])
  })

  it('hides Users from IT staff', () => {
    renderWithAuth(<AppLayout />, { auth: loggedInAs('it_staff') })
    expect(navLinkNames()).toEqual(['Dashboard', 'Tickets', 'Assets'])
  })

  it('shows employees "My" links and no Users link', () => {
    renderWithAuth(<AppLayout />, { auth: loggedInAs('employee') })
    expect(navLinkNames()).toEqual(['Dashboard', 'My Tickets', 'My Assets'])
  })

  it('shows the user name and role badge', () => {
    renderWithAuth(<AppLayout />, { auth: loggedInAs('it_staff') })
    expect(screen.getByText('Test it_staff')).toBeInTheDocument()
    expect(screen.getByText('IT Staff')).toBeInTheDocument()
  })

  it('signs out when the button is clicked', async () => {
    const user = userEvent.setup()
    const { auth } = renderWithAuth(<AppLayout />, { auth: loggedInAs('employee') })

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(auth.signOut).toHaveBeenCalledOnce()
  })
})

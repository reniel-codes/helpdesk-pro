import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { loggedInAs, renderWithAuth } from '../../test/renderWithAuth'
import type { AuthContextValue } from './AuthContext'
import { ProtectedRoute } from './ProtectedRoute'

function renderAdminPage(auth: Partial<AuthContextValue>) {
  return renderWithAuth(
    <Routes>
      <Route path="/login" element={<p>Login page</p>} />
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/users" element={<p>Secret admin page</p>} />
      </Route>
    </Routes>,
    { auth, route: '/users' },
  )
}

describe('ProtectedRoute', () => {
  it('shows a loading message while auth is loading', () => {
    renderAdminPage({ loading: true })
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByText('Secret admin page')).not.toBeInTheDocument()
  })

  it('sends logged-out visitors to the login page', () => {
    renderAdminPage({})
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('shows the page to an allowed role', () => {
    renderAdminPage(loggedInAs('admin'))
    expect(screen.getByText('Secret admin page')).toBeInTheDocument()
  })

  it.each(['it_staff', 'employee'] as const)('blocks the %s role', (role) => {
    renderAdminPage(loggedInAs(role))
    expect(screen.getByRole('heading', { name: 'Access denied' })).toBeInTheDocument()
    expect(screen.queryByText('Secret admin page')).not.toBeInTheDocument()
  })

  it('explains when a logged-in user has no profile', () => {
    renderAdminPage({ ...loggedInAs('admin'), profile: null })
    expect(screen.getByRole('heading', { name: 'Profile not found' })).toBeInTheDocument()
  })
})

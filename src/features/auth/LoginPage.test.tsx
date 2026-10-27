import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { loggedInAs, renderWithAuth } from '../../test/renderWithAuth'
import { LoginPage } from './LoginPage'

function renderLogin(auth = {}) {
  return renderWithAuth(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<p>Home page</p>} />
    </Routes>,
    { auth, route: '/login' },
  )
}

describe('LoginPage', () => {
  it('shows validation errors and does not call the server when fields are empty', async () => {
    const user = userEvent.setup()
    const { auth } = renderLogin()

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(auth.signIn).not.toHaveBeenCalled()
  })

  it('signs in with the trimmed email and goes to the home page', async () => {
    const user = userEvent.setup()
    const { auth } = renderLogin()

    await user.type(screen.getByLabelText('Email'), '  staff@helpdesk.test ')
    await user.type(screen.getByLabelText('Password'), 'correct-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(auth.signIn).toHaveBeenCalledWith('staff@helpdesk.test', 'correct-password')
    expect(await screen.findByText('Home page')).toBeInTheDocument()
  })

  it('shows the server error when sign-in fails and stays on the page', async () => {
    const user = userEvent.setup()
    renderLogin({ signIn: vi.fn().mockResolvedValue({ error: 'Invalid email or password.' }) })

    await user.type(screen.getByLabelText('Email'), 'staff@helpdesk.test')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.')
    expect(screen.queryByText('Home page')).not.toBeInTheDocument()
  })

  it('disables the button while signing in to prevent double submits', async () => {
    const user = userEvent.setup()
    // A sign-in that never finishes, so we can look at the "in progress" state.
    renderLogin({ signIn: vi.fn(() => new Promise(() => {})) })

    await user.type(screen.getByLabelText('Email'), 'staff@helpdesk.test')
    await user.type(screen.getByLabelText('Password'), 'pw')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(screen.getByRole('button', { name: 'Signing in…' })).toBeDisabled()
  })

  it('redirects away from the login page when already signed in', () => {
    renderLogin(loggedInAs('employee'))
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })
})

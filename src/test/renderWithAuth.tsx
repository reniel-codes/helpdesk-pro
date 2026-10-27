import type { Session } from '@supabase/supabase-js'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import {
  AuthContext,
  type AuthContextValue,
  type Profile,
  type Role,
} from '../features/auth/AuthContext'

/** A fake profile for tests. Pass overrides for the fields you care about. */
export function makeProfile(role: Role, overrides: Partial<Profile> = {}): Profile {
  return {
    id: `${role}-id`,
    email: `${role}@helpdesk.test`,
    full_name: `Test ${role}`,
    role,
    department: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

/** A fake logged-in state for the given role. */
export function loggedInAs(role: Role): Partial<AuthContextValue> {
  const profile = makeProfile(role)
  return { session: { user: { id: profile.id } } as Session, profile }
}

type Options = {
  auth?: Partial<AuthContextValue>
  /** The URL the test starts on. */
  route?: string
}

/**
 * Renders a component with a fake auth state and router, so tests never talk
 * to the real Supabase. Returns the fake auth functions so tests can check calls.
 */
export function renderWithAuth(ui: ReactElement, { auth = {}, route = '/' }: Options = {}) {
  const value: AuthContextValue = {
    session: null,
    profile: null,
    loading: false,
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue(undefined),
    ...auth,
  }

  const result = render(
    <AuthContext value={value}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthContext>,
  )
  return { ...result, auth: value }
}

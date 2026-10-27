import { describe, expect, it } from 'vitest'
import { validateLogin } from './validateLogin'

describe('validateLogin', () => {
  it('accepts a valid email and password', () => {
    expect(validateLogin('user@helpdesk.test', 'secret')).toEqual({})
  })

  it('requires an email', () => {
    expect(validateLogin('', 'secret').email).toBe('Email is required.')
  })

  it('treats a whitespace-only email as empty', () => {
    expect(validateLogin('   ', 'secret').email).toBe('Email is required.')
  })

  it.each(['plainaddress', 'missing-at.com', 'user@', 'user@domain', 'user name@test.com'])(
    'rejects malformed email "%s"',
    (email) => {
      expect(validateLogin(email, 'secret').email).toBe('Enter a valid email address.')
    },
  )

  it('requires a password', () => {
    expect(validateLogin('user@helpdesk.test', '').password).toBe('Password is required.')
  })

  it('reports both errors at once', () => {
    expect(validateLogin('', '')).toEqual({
      email: 'Email is required.',
      password: 'Password is required.',
    })
  })
})

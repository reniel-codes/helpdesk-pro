import { describe, expect, it } from 'vitest'
import { validateNote, validateTicket } from './validateTicket'

const OK_DESC = 'Something is broken.'

describe('validateTicket', () => {
  it('accepts a valid title and description', () => {
    expect(validateTicket('Laptop will not boot', OK_DESC)).toEqual({})
  })

  it('requires a title', () => {
    expect(validateTicket('', OK_DESC).title).toBe('Title is required.')
  })

  it('treats a whitespace-only title as empty', () => {
    expect(validateTicket('     ', OK_DESC).title).toBe('Title is required.')
  })

  // Boundary value analysis: test just below, at, and just above each limit.
  it.each([
    [4, 'Title must be at least 5 characters.'],
    [5, undefined],
    [120, undefined],
    [121, 'Title must be 120 characters or fewer.'],
  ])('title of %i characters -> %s', (length, expected) => {
    expect(validateTicket('a'.repeat(length), OK_DESC).title).toBe(expected)
  })

  it('measures title length after trimming spaces', () => {
    expect(validateTicket('  abcd  ', OK_DESC).title).toBe('Title must be at least 5 characters.')
  })

  it('requires a description', () => {
    expect(validateTicket('Valid title', '  ').description).toBe('Description is required.')
  })

  it.each([
    [5000, undefined],
    [5001, 'Description must be 5000 characters or fewer.'],
  ])('description of %i characters -> %s', (length, expected) => {
    expect(validateTicket('Valid title', 'a'.repeat(length)).description).toBe(expected)
  })
})

describe('validateNote', () => {
  it('accepts a normal note', () => {
    expect(validateNote('Restarted the router.')).toBeNull()
  })

  it('rejects an empty or whitespace-only note', () => {
    expect(validateNote('')).toBe('Note cannot be empty.')
    expect(validateNote('   \n ')).toBe('Note cannot be empty.')
  })

  it('rejects a note over 5000 characters', () => {
    expect(validateNote('a'.repeat(5001))).toBe('Note must be 5000 characters or fewer.')
  })
})

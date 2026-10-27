import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/types/database.ts'

export type Client = SupabaseClient<Database>

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.test.example to .env.test.local and fill in the demo account passwords.`,
    )
  }
  return value
}

/** A fresh client with no saved session, like a brand-new browser. */
export function anonClient(): Client {
  return createClient<Database>(
    requireEnv('VITE_SUPABASE_URL'),
    requireEnv('VITE_SUPABASE_ANON_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * Logs in as a demo user using only the public anon key — exactly what an
 * attacker with a valid account could do from the browser console.
 */
export async function signedInClient(role: 'ADMIN' | 'STAFF' | 'EMPLOYEE') {
  const client = anonClient()
  const email = process.env[`TEST_${role}_EMAIL`] || `${role.toLowerCase()}@helpdesk.test`
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: requireEnv(`TEST_${role}_PASSWORD`),
  })
  if (error) throw new Error(`Could not sign in as ${email}: ${error.message}`)
  return { client, userId: data.user.id }
}

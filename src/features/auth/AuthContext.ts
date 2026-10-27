import type { Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'
import type { Enums, Tables } from '../../types/database'

export type Profile = Tables<'profiles'>
export type Role = Enums<'user_role'>

export type AuthContextValue = {
  session: Session | null
  profile: Profile | null
  /** True until we know whether someone is logged in and have loaded their profile. */
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return value
}

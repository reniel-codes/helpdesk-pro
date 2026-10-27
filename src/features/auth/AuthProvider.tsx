import type { Session } from '@supabase/supabase-js'
import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'
import { AuthContext, type Profile } from './AuthContext'

type LoadedProfile = { userId: string; profile: Profile | null }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null)

  // 1. Track who is logged in. Supabase calls this right away with the saved
  //    session (if any), and again on every login, logout, or token refresh.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setSessionChecked(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  // 2. Load the profile (name + role) whenever the logged-in user changes.
  //    This is a separate effect because Supabase warns against awaiting other
  //    Supabase calls inside onAuthStateChange (it can freeze the client).
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Could not load profile:', error.message)
        setLoaded({ userId, profile: data ?? null })
      })

    // If the user changes before the request finishes, ignore the old result.
    return () => {
      cancelled = true
    }
  }, [userId])

  // Worked out from state on every render, so they can never get out of sync.
  // We remember which user a profile belongs to, so a stale profile from the
  // previous user is never shown after switching accounts.
  const profileIsCurrent = !!userId && loaded?.userId === userId
  const profile = profileIsCurrent ? loaded.profile : null
  const loading = !sessionChecked || (!!userId && !profileIsCurrent)

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return { error: null }
    // Same message for "wrong password" and "no such user", so attackers
    // can't use the login form to discover which emails have accounts.
    if (error.code === 'invalid_credentials') {
      return { error: 'Invalid email or password.' }
    }
    return { error: error.message }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext value={{ session, profile, loading, signIn, signOut }}>{children}</AuthContext>
  )
}

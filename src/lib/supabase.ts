import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase settings. Copy .env.example to .env.local and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}

// The one shared client for the whole app. The anon key is safe to ship to the
// browser because Row Level Security in the database decides what each user can do.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

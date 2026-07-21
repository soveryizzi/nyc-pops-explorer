import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Null when the env vars are absent (e.g. production before the
// submissions feature launches) — every consumer treats null as
// "feature off", so builds without keys behave exactly like v1.
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

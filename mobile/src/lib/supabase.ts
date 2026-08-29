import { createClient } from '@supabase/supabase-js'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabaseConfigOk = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
)

export const supabase = createClient(url, anonKey)

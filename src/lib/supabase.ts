/**
 * lib/supabase.ts
 *
 * Single browser-side Supabase client for React + Vite SPA.
 * Uses @supabase/supabase-js (not @supabase/ssr — no server context needed).
 *
 * Usage:
 *   import { supabase } from '@/lib/supabase'
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase env vars. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  )
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

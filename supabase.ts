/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

// Load environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail safely if variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase Environment Variables! Check .env.local')
}

// Create and export the client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
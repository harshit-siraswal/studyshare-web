import { createClient } from '@supabase/supabase-js'

// Supabase URL + anon key are public-by-design values for frontend usage.
// Keep safe fallbacks so production doesn't crash if hosting env vars are missing.
const DEFAULT_SUPABASE_CONFIG = {
  url: 'https://iayuwsvguwfqjgjsvjiy.supabase.co',
  publishableKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlheXV3c3ZndXdmcWpnanN2aml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTE5MTEsImV4cCI6MjA4MTYyNzkxMX0.EQhiq-yv9QLBNL_kmT5P59AZPykQkEZwbNbilxquYOA',
}

const getEnv = (key) => {
  const value = import.meta.env[key]
  return typeof value === 'string' ? value.trim() : ''
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || DEFAULT_SUPABASE_CONFIG.url
const supabaseAnonKey =
  getEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ||
  getEnv('VITE_SUPABASE_ANON_KEY') ||
  DEFAULT_SUPABASE_CONFIG.publishableKey

const missingSupabaseVars = []
if (!supabaseUrl) missingSupabaseVars.push('VITE_SUPABASE_URL')
if (!supabaseAnonKey) missingSupabaseVars.push('VITE_SUPABASE_PUBLISHABLE_KEY')

if (missingSupabaseVars.length > 0) {
  console.warn(
    `[Supabase] Missing config entries after fallbacks: ${missingSupabaseVars.join(', ')}. ` +
      'Supabase features may not work until env vars are configured.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

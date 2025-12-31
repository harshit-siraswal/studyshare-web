

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iayuwsvguwfqjgjsvjiy.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlheXV3c3ZndXdmcWpnanN2aml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNTE5MTEsImV4cCI6MjA4MTYyNzkxMX0.EQhiq-yv9QLBNL_kmT5P59AZPykQkEZwbNbilxquYOA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
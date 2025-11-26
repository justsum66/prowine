import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ohchipfmenenezlnnrjv.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oY2hpcGZtZW5lbmV6bG5ucmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjIwNDYsImV4cCI6MjA3OTczODA0Nn0.mLY3jKvhK27H9ORHejLgt86MkUj8DsdEWal__T05rzY'

  if (!supabaseUrl) {
    throw new Error('Supabase URL is required. Please check NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable.')
  }

  if (!supabaseKey) {
    throw new Error('Supabase Key is required. Please check SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable.')
  }

  return createClient(supabaseUrl, supabaseKey)
}


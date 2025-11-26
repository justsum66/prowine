import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  // 使用硬編碼的 Supabase 連接資訊（用戶已提供）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohchipfmenenezlnnrjv.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oY2hpcGZtZW5lbmV6bG5ucmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjIwNDYsImV4cCI6MjA3OTczODA0Nn0.mLY3jKvhK27H9ORHejLgt86MkUj8DsdEWal__T05rzY'

  // 確保有有效的 URL 和 Key
  const finalUrl = supabaseUrl || 'https://ohchipfmenenezlnnrjv.supabase.co'
  const finalKey = supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oY2hpcGZtZW5lbmV6bG5ucmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjIwNDYsImV4cCI6MjA3OTczODA0Nn0.mLY3jKvhK27H9ORHejLgt86MkUj8DsdEWal__T05rzY'

  return createServerClient(
    finalUrl,
    finalKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch {
            // The `remove` method was called from a Server Component.
          }
        },
      },
    }
  )
}


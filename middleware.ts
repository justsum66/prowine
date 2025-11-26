import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 使用硬編碼的 Supabase 連接資訊（用戶已提供）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohchipfmenenezlnnrjv.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oY2hpcGZtZW5lbmV6bG5ucmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjIwNDYsImV4cCI6MjA3OTczODA0Nn0.mLY3jKvhK27H9ORHejLgt86MkUj8DsdEWal__T05rzY'

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set(name, value)
          response = NextResponse.next({
            request,
          })
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          request.cookies.set(name, '')
          response = NextResponse.next({
            request,
          })
          response.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  // 保護管理後台路由
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}


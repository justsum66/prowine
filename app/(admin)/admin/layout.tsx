import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Wine, Building2, FileText, MessageSquare, Settings } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 簡單的權限檢查（實際應該檢查user role）
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-secondary-grey-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-primary-dark text-white min-h-screen p-6">
          <h1 className="font-display text-2xl font-bold mb-8">ProWine 後台</h1>
          <nav className="space-y-2">
            <Link
              href="/admin"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="font-sans text-sm">儀表板</span>
            </Link>
            <Link
              href="/admin/wines"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Wine className="w-5 h-5" />
              <span className="font-sans text-sm">酒款管理</span>
            </Link>
            <Link
              href="/admin/wineries"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Building2 className="w-5 h-5" />
              <span className="font-sans text-sm">酒莊管理</span>
            </Link>
            <Link
              href="/admin/posts"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="font-sans text-sm">文章管理</span>
            </Link>
            <Link
              href="/admin/inquiries"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-white/10 rounded-lg transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-sans text-sm">詢價管理</span>
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}


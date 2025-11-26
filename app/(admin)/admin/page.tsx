import { createClient } from '@/lib/supabase/server'
import { Wine, Building2, MessageSquare, TrendingUp } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: winesCount },
    { count: wineriesCount },
    { count: inquiriesCount },
    { count: pendingInquiries },
  ] = await Promise.all([
    supabase.from('wines').select('*', { count: 'exact', head: true }),
    supabase.from('wineries').select('*', { count: 'exact', head: true }),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }),
    supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  return (
    <div>
      <h1 className="font-display text-4xl font-bold text-primary-dark mb-8">
        儀表板
      </h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Wine className="w-8 h-8 text-primary-burgundy" />
            <TrendingUp className="w-5 h-5 text-primary-gold" />
          </div>
          <p className="font-sans text-sm text-secondary-grey-600 mb-1">總酒款數</p>
          <p className="font-display text-3xl font-bold text-primary-dark">
            {winesCount || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Building2 className="w-8 h-8 text-primary-burgundy" />
            <TrendingUp className="w-5 h-5 text-primary-gold" />
          </div>
          <p className="font-sans text-sm text-secondary-grey-600 mb-1">總酒莊數</p>
          <p className="font-display text-3xl font-bold text-primary-dark">
            {wineriesCount || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <MessageSquare className="w-8 h-8 text-primary-burgundy" />
            <TrendingUp className="w-5 h-5 text-primary-gold" />
          </div>
          <p className="font-sans text-sm text-secondary-grey-600 mb-1">總詢價數</p>
          <p className="font-display text-3xl font-bold text-primary-dark">
            {inquiriesCount || 0}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <MessageSquare className="w-8 h-8 text-warning" />
          </div>
          <p className="font-sans text-sm text-secondary-grey-600 mb-1">待處理詢價</p>
          <p className="font-display text-3xl font-bold text-primary-dark">
            {pendingInquiries || 0}
          </p>
        </div>
      </div>

      {/* Recent Inquiries */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="font-serif text-2xl font-semibold text-primary-dark mb-4">
          最近詢價
        </h2>
        <div className="space-y-4">
          {/* 這裡應該顯示最近的詢價列表 */}
          <p className="font-sans text-base text-secondary-grey-600">
            目前沒有詢價記錄
          </p>
        </div>
      </div>
    </div>
  )
}


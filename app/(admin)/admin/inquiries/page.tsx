import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'

export default async function InquiriesPage() {
  const supabase = await createClient()

  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div>
      <h1 className="font-display text-4xl font-bold text-primary-dark mb-8">
        詢價管理
      </h1>

      {inquiries && inquiries.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-primary-cream">
              <tr>
                <th className="px-6 py-4 text-left font-sans text-sm font-semibold text-primary-dark">
                  日期
                </th>
                <th className="px-6 py-4 text-left font-sans text-sm font-semibold text-primary-dark">
                  姓名
                </th>
                <th className="px-6 py-4 text-left font-sans text-sm font-semibold text-primary-dark">
                  Email
                </th>
                <th className="px-6 py-4 text-left font-sans text-sm font-semibold text-primary-dark">
                  類型
                </th>
                <th className="px-6 py-4 text-left font-sans text-sm font-semibold text-primary-dark">
                  狀態
                </th>
                <th className="px-6 py-4 text-left font-sans text-sm font-semibold text-primary-dark">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-grey-200">
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-primary-cream/50">
                  <td className="px-6 py-4 font-sans text-sm text-secondary-grey-600">
                    {format(new Date(inquiry.created_at), 'yyyy/MM/dd HH:mm', {
                      locale: zhTW,
                    })}
                  </td>
                  <td className="px-6 py-4 font-sans text-sm text-primary-dark">
                    {inquiry.name}
                  </td>
                  <td className="px-6 py-4 font-sans text-sm text-secondary-grey-600">
                    {inquiry.email}
                  </td>
                  <td className="px-6 py-4 font-sans text-sm text-secondary-grey-600">
                    {inquiry.inquiry_type === 'bulk'
                      ? '大量採購'
                      : inquiry.inquiry_type === 'product'
                      ? '商品詢價'
                      : '一般詢問'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        inquiry.status === 'pending'
                          ? 'bg-warning/20 text-warning'
                          : inquiry.status === 'contacted'
                          ? 'bg-info/20 text-info'
                          : 'bg-success/20 text-success'
                      }`}
                    >
                      {inquiry.status === 'pending'
                        ? '待處理'
                        : inquiry.status === 'contacted'
                        ? '已聯繫'
                        : '已結案'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="outline" size="sm">
                      查看詳情
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow-sm text-center">
          <p className="font-sans text-lg text-secondary-grey-600">
            目前沒有詢價記錄
          </p>
        </div>
      )}
    </div>
  )
}


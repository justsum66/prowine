import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

// 強制動態渲染（因為使用 cookies）
export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  const supabase = await createClient()

  let posts = null
  let hasError = false

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching blog posts:', error)
      hasError = true
    } else {
      posts = data
    }
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    hasError = true
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="font-display text-5xl font-bold text-primary-dark mb-4">
          品酩知識
        </h1>
        <p className="font-sans text-lg text-secondary-grey-600">
          探索葡萄酒的世界，深入了解風土、工藝與品味
        </p>
      </div>

      {hasError ? (
        <div className="text-center py-16">
          <p className="font-sans text-lg text-secondary-grey-600 mb-4">
            資料載入錯誤，請稍後再試
          </p>
          <p className="font-sans text-sm text-secondary-grey-400">
            如果問題持續，請聯繫技術支援
          </p>
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block bg-white hover:shadow-lg transition-shadow duration-300"
            >
              {post.featured_image_url && (
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={post.featured_image_url}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-6">
                {post.category && (
                  <p className="font-sans text-xs text-primary-burgundy uppercase tracking-wide mb-2">
                    {post.category}
                  </p>
                )}
                <h2 className="font-serif text-2xl font-semibold text-primary-dark mb-3 group-hover:text-primary-burgundy transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="font-sans text-sm text-secondary-grey-600 line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>
                )}
                {post.published_at && (
                  <p className="font-sans text-xs text-secondary-grey-400">
                    {format(new Date(post.published_at), 'yyyy年MM月dd日', {
                      locale: zhTW,
                    })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="font-sans text-lg text-secondary-grey-600">
            目前沒有文章
          </p>
        </div>
      )}
    </div>
  )
}


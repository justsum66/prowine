import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

// 強制動態渲染（因為使用 cookies）
export const dynamic = 'force-dynamic'

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    notFound()
  }

  return (
    <article className="container mx-auto px-4 py-16 max-w-4xl">
      {post.featured_image_url && (
        <div className="relative aspect-video mb-12">
          <Image
            src={post.featured_image_url}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <header className="mb-12">
        {post.category && (
          <p className="font-sans text-sm text-primary-burgundy uppercase tracking-wide mb-4">
            {post.category}
          </p>
        )}
        <h1 className="font-display text-5xl font-bold text-primary-dark mb-6">
          {post.title}
        </h1>
        {post.published_at && (
          <p className="font-sans text-base text-secondary-grey-400">
            {format(new Date(post.published_at), 'yyyy年MM月dd日', {
              locale: zhTW,
            })}
          </p>
        )}
      </header>

      <div
        className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-primary-dark prose-p:text-secondary-grey-600 prose-p:leading-relaxed prose-a:text-primary-burgundy prose-a:no-underline hover:prose-a:underline"
      >
        <div className="font-serif text-base text-secondary-grey-600 leading-relaxed whitespace-pre-line">
          {post.content}
        </div>
      </div>
    </article>
  )
}


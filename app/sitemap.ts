import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prowine.com.tw'

  const [wines, wineries, posts] = await Promise.all([
    supabase.from('wines').select('slug, updated_at').eq('is_available', true),
    supabase.from('wineries').select('slug, updated_at'),
    supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published'),
  ])

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/wines`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/wineries`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  // Add wine pages
  if (wines.data) {
    wines.data.forEach((wine) => {
      routes.push({
        url: `${baseUrl}/wines/${wine.slug}`,
        lastModified: new Date(wine.updated_at),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    })
  }

  // Add winery pages
  if (wineries.data) {
    wineries.data.forEach((winery) => {
      routes.push({
        url: `${baseUrl}/wineries/${winery.slug}`,
        lastModified: new Date(winery.updated_at),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    })
  }

  // Add blog posts
  if (posts.data) {
    posts.data.forEach((post) => {
      routes.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    })
  }

  return routes
}


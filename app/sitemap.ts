import { MetadataRoute } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/client';

/**
 * 動態生成的 Sitemap（優化任務 #35）
 * 包含所有靜態頁面和動態頁面（酒款、酒莊、文章）
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prowine.com.tw';
  const supabase = createServerSupabaseClient();

  // 靜態頁面
  const staticPages: MetadataRoute.Sitemap = [
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
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/knowledge`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  try {
    // 獲取所有已發布的酒款
    const { data: wines, error: winesError } = await supabase
      .from('wines')
      .select('id, slug, updatedAt')
      .eq('published', true)
      .limit(1000); // 限制數量避免sitemap過大

    const winePages: MetadataRoute.Sitemap = wines && !winesError
      ? wines.map((wine) => ({
          url: `${baseUrl}/wines/${wine.slug || wine.id}`,
          lastModified: wine.updatedAt ? new Date(wine.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      : [];

    // 獲取所有已發布的酒莊
    const { data: wineries, error: wineriesError } = await supabase
      .from('wineries')
      .select('id, slug, updatedAt')
      .eq('published', true)
      .limit(500);

    const wineryPages: MetadataRoute.Sitemap = wineries && !wineriesError
      ? wineries.map((winery) => ({
          url: `${baseUrl}/wineries/${winery.slug || winery.id}`,
          lastModified: winery.updatedAt ? new Date(winery.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
      : [];

    // 獲取所有已發布的文章
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('id, slug, updatedAt')
      .eq('published', true)
      .limit(500);

    const articlePages: MetadataRoute.Sitemap = articles && !articlesError
      ? articles.map((article) => ({
          url: `${baseUrl}/knowledge/${article.slug || article.id}`,
          lastModified: article.updatedAt ? new Date(article.updatedAt) : new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
      : [];

    return [...staticPages, ...winePages, ...wineryPages, ...articlePages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // 如果出錯，至少返回靜態頁面
    return staticPages;
  }
}

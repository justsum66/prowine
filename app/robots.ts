import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://prowine.com.tw';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/account/',
          '/cart/',
          '/wishlist/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}


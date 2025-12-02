/**
 * 結構化數據（Schema.org）生成工具
 * 用於 SEO 優化（優化任務 #5）
 */

export interface OrganizationSchema {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    "@type": string;
    telephone: string;
    contactType: string;
  };
  sameAs?: string[];
}

export interface ProductSchema {
  "@context": string;
  "@type": string;
  name: string;
  description?: string;
  image?: string | string[];
  brand?: {
    "@type": string;
    name: string;
  };
  offers?: {
    "@type": string;
    priceCurrency: string;
    price: string;
    availability: string;
  };
  aggregateRating?: {
    "@type": string;
    ratingValue: string;
    reviewCount: string;
  };
}

export interface WinerySchema {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  logo?: string;
  description?: string;
  address?: {
    "@type": string;
    addressRegion?: string;
    addressCountry?: string;
  };
}

export interface BreadcrumbSchema {
  "@context": string;
  "@type": string;
  itemListElement: Array<{
    "@type": string;
    position: number;
    name: string;
    item: string;
  }>;
}

export function generateOrganizationSchema(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ProWine 酩陽實業",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw",
    logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/fwdlogo/Logo-大.png`,
    description: "專業葡萄酒進口商，提供來自世界頂級酒莊的精品葡萄酒",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+886-2-1234-5678",
      contactType: "customer service",
    },
    sameAs: [
      "https://www.facebook.com/prowine",
      "https://www.instagram.com/prowine",
    ],
  };
}

export function generateProductSchema(wine: {
  nameZh: string;
  nameEn: string;
  descriptionZh?: string;
  descriptionEn?: string;
  mainImageUrl?: string;
  price: number;
  winery: {
    nameZh: string;
    nameEn: string;
  };
  ratings?: {
    decanter?: number;
    jamesSuckling?: number;
    robertParker?: number;
  };
}): ProductSchema {
  const rating = wine.ratings?.decanter || wine.ratings?.jamesSuckling || wine.ratings?.robertParker;
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: wine.nameZh,
    description: wine.descriptionZh || wine.descriptionEn || "",
    image: wine.mainImageUrl ? [wine.mainImageUrl] : undefined,
    brand: {
      "@type": "Brand",
      name: wine.winery.nameZh || wine.winery.nameEn,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "TWD",
      price: wine.price.toString(),
      availability: "https://schema.org/InStock",
    },
    ...(rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating.toString(),
        reviewCount: "1",
      },
    }),
  };
}

export function generateWinerySchema(winery: {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  region?: string;
  country?: string;
}): WinerySchema {
  return {
    "@context": "https://schema.org",
    "@type": "Winery",
    name: winery.name,
    url: winery.url,
    ...(winery.logo && { logo: winery.logo }),
    ...(winery.description && { description: winery.description }),
    ...((winery.region || winery.country) && {
      address: {
        "@type": "PostalAddress",
        ...(winery.region && { addressRegion: winery.region }),
        ...(winery.country && { addressCountry: winery.country }),
      },
    }),
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): BreadcrumbSchema {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw";
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}

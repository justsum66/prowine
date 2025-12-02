/**
 * 結構化數據組件（JSON-LD）
 * 用於 SEO 優化
 */

import { generateOrganizationSchema, generateProductSchema, generateWinerySchema, generateBreadcrumbSchema } from "@/lib/utils/structured-data";

interface StructuredDataProps {
  type: "organization" | "product" | "winery" | "breadcrumb";
  data?: any;
  breadcrumbItems?: Array<{ name: string; url: string }>;
}

export default function StructuredData({ type, data, breadcrumbItems }: StructuredDataProps) {
  let schema: any = null;

  switch (type) {
    case "organization":
      if (data) {
        // 自定義組織數據（如酒莊詳情頁）
        schema = {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: data.name,
          url: data.url,
          ...(data.logo && { logo: data.logo }),
          ...(data.description && { description: data.description }),
        };
      } else {
        // 默認組織數據（根布局）
        schema = generateOrganizationSchema();
      }
      break;
    case "product":
      if (data) {
        schema = generateProductSchema(data);
      }
      break;
    case "winery":
      if (data) {
        schema = generateWinerySchema(data);
      }
      break;
    case "breadcrumb":
      if (breadcrumbItems) {
        schema = generateBreadcrumbSchema(breadcrumbItems);
      }
      break;
  }

  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}


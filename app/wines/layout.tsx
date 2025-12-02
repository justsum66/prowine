import type { Metadata } from "next";

/**
 * 酒款列表頁面 SEO Layout（優化任務 #31）
 */
export const metadata: Metadata = {
  title: "精品酒款 | ProWine 酩陽實業 - 探索世界頂級葡萄酒",
  description: "瀏覽ProWine精選的頂級葡萄酒收藏。來自法國波爾多、勃艮第、義大利托斯卡納、美國納帕谷等世界知名產區的優質酒款，滿足您的每一種品飲需求。",
  keywords: ["葡萄酒", "紅酒", "白酒", "香檳", "波爾多", "勃艮第", "納帕谷", "托斯卡納", "精品葡萄酒"],
  openGraph: {
    title: "精品酒款 | ProWine 酩陽實業",
    description: "探索世界頂級葡萄酒收藏",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/wines`,
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/wines`,
  },
};

export default function WinesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

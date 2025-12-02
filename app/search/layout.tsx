import type { Metadata } from "next";

/**
 * 搜尋頁面 SEO Layout（優化任務 #31）
 */
export const metadata: Metadata = {
  title: "搜尋 | ProWine 酩陽實業 - 找到您心儀的葡萄酒",
  description: "使用ProWine智能搜尋功能，快速找到符合您需求的精品葡萄酒。支援多種搜尋條件，包括產區、年份、價格、評分等，輕鬆探索豐富的葡萄酒收藏。",
  keywords: ["葡萄酒搜尋", "搜尋酒款", "酒莊搜尋", "產區搜尋", "智能搜尋"],
  openGraph: {
    title: "搜尋 | ProWine 酩陽實業",
    description: "使用智能搜尋功能，快速找到您心儀的葡萄酒",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/search`,
  },
  robots: {
    index: false, // 搜尋結果頁面不需要被索引
    follow: true,
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


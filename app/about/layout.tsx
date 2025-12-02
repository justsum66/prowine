import type { Metadata } from "next";

/**
 * 關於我們頁面 SEO Layout（優化任務 #31）
 */
export const metadata: Metadata = {
  title: "關於我們 | ProWine 酩陽實業 - 專業葡萄酒進口商",
  description: "了解ProWine酩陽實業的故事。自2015年成立以來，我們致力於將世界頂級精品葡萄酒帶入台灣市場，推廣葡萄酒文化，為每位愛酒人士提供專業服務。",
  keywords: ["關於ProWine", "葡萄酒進口商", "ProWine歷史", "公司介紹", "葡萄酒文化"],
  openGraph: {
    title: "關於我們 | ProWine 酩陽實業",
    description: "專業葡萄酒進口商，推廣葡萄酒文化",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/about`,
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/about`,
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


import type { Metadata } from "next";

/**
 * 常見問題頁面 SEO Layout（優化任務 #31）
 */
export const metadata: Metadata = {
  title: "常見問題 | ProWine 酩陽實業 - 葡萄酒相關問題解答",
  description: "查找關於ProWine服務、葡萄酒選擇、保存方法、配送等常見問題的詳細解答。我們為您提供全面的葡萄酒知識和服務指南。",
  keywords: ["常見問題", "FAQ", "葡萄酒問題", "服務問答", "購買指南"],
  openGraph: {
    title: "常見問題 | ProWine 酩陽實業",
    description: "查找葡萄酒相關問題的詳細解答",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/faq`,
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/faq`,
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


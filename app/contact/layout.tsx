import type { Metadata } from "next";

/**
 * 聯絡我們頁面 SEO Layout（優化任務 #31）
 */
export const metadata: Metadata = {
  title: "聯絡我們 | ProWine 酩陽實業 - 專業葡萄酒諮詢服務",
  description: "需要協助選擇適合的葡萄酒？想了解更多關於我們的服務？歡迎與ProWine專業團隊聯繫。我們提供個人化諮詢、企業採購服務，以及專業的葡萄酒知識分享。",
  keywords: ["聯絡ProWine", "葡萄酒諮詢", "企業採購", "葡萄酒服務", "客戶服務"],
  openGraph: {
    title: "聯絡我們 | ProWine 酩陽實業",
    description: "專業葡萄酒諮詢服務，隨時為您提供協助",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/contact`,
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/contact`,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


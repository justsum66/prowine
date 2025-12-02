import type { Metadata } from "next";

// 首頁 SEO Metadata（優化任務 #31）
export const metadata: Metadata = {
  title: "首頁 | ProWine 酩陽實業 - 精品葡萄酒進口商",
  description: "ProWine 酩陽實業專業提供來自世界頂級酒莊的精品葡萄酒。探索法國波爾多、勃艮第、義大利托斯卡納、美國納帕谷等產區的優質酒款，享受專業的葡萄酒購物體驗。",
  keywords: ["葡萄酒", "紅酒", "白酒", "香檳", "波爾多", "勃艮第", "納帕谷", "托斯卡納", "精品葡萄酒", "葡萄酒進口商"],
  openGraph: {
    title: "ProWine 酩陽實業 - 精品葡萄酒進口商",
    description: "專業提供來自世界頂級酒莊的精品葡萄酒",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/fwdlogo/logo-large.png`,
        width: 1200,
        height: 630,
        alt: "ProWine 酩陽實業",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProWine 酩陽實業 - 精品葡萄酒進口商",
    description: "專業提供來自世界頂級酒莊的精品葡萄酒",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/fwdlogo/logo-large.png`],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw",
  },
};

export default function HomePageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


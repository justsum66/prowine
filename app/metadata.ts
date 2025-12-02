import { Metadata } from "next";

export const defaultMetadata: Metadata = {
  title: "ProWine 酩陽實業 | 精品葡萄酒電商",
  description: "專業葡萄酒進口商，提供來自世界頂級酒莊的精品葡萄酒。探索納帕谷、波爾多、里奧哈等頂級產區的優質酒款。",
  keywords: ["葡萄酒", "紅酒", "白酒", "香檳", "酒莊", "ProWine", "酩陽實業", "納帕谷", "波爾多", "里奧哈"],
  authors: [{ name: "ProWine 酩陽實業" }],
  creator: "ProWine 酩陽實業",
  publisher: "ProWine 酩陽實業",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw",
    siteName: "ProWine 酩陽實業",
    title: "ProWine 酩陽實業 | 精品葡萄酒電商",
    description: "專業葡萄酒進口商，提供來自世界頂級酒莊的精品葡萄酒",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ProWine 酩陽實業",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ProWine 酩陽實業 | 精品葡萄酒電商",
    description: "專業葡萄酒進口商，提供來自世界頂級酒莊的精品葡萄酒",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // 可以添加 Google Search Console 驗證碼
    // google: "your-google-verification-code",
  },
};


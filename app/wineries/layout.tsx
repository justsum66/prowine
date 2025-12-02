import type { Metadata } from "next";

/**
 * 酒莊列表頁面 SEO Layout（優化任務 #31）
 */
export const metadata: Metadata = {
  title: "精選酒莊 | ProWine 酩陽實業 - 世界頂級酒莊合作夥伴",
  description: "探索ProWine合作的頂級酒莊。從法國五大酒莊到義大利傳奇莊園，從新世界創新釀酒師到舊世界傳統工藝，每一家酒莊都代表著卓越的釀酒藝術。",
  keywords: ["酒莊", "法國酒莊", "義大利酒莊", "波爾多酒莊", "勃艮第酒莊", "納帕谷酒莊", "精品酒莊"],
  openGraph: {
    title: "精選酒莊 | ProWine 酩陽實業",
    description: "探索世界頂級酒莊合作夥伴",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/wineries`,
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/wineries`,
  },
};

export default function WineriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

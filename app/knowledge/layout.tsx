import type { Metadata } from "next";

/**
 * 知識學堂頁面 SEO Layout（優化任務 #31）
 */
export const metadata: Metadata = {
  title: "知識學堂 | ProWine 酩陽實業 - 葡萄酒知識與文化",
  description: "探索葡萄酒的奧妙世界。從基礎知識到專業品飲技巧，從產區風土到配餐建議，ProWine 知識學堂為您提供豐富的葡萄酒文化內容。",
  keywords: ["葡萄酒知識", "品酒技巧", "葡萄酒文化", "產區介紹", "配餐建議", "葡萄酒保存", "酒莊故事"],
  openGraph: {
    title: "知識學堂 | ProWine 酩陽實業",
    description: "探索葡萄酒的奧妙世界，從基礎知識到專業品飲技巧",
    type: "website",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/knowledge`,
  },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || "https://prowine.com.tw"}/knowledge`,
  },
};

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}


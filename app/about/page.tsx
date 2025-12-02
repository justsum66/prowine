"use client";

import { motion } from "framer-motion";
import { Award, Users, Globe, Heart } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// 動態導入品牌故事頁面（減少初始bundle大小）
const BrandStoryPage = dynamic(() => import("@/components/BrandStoryPage"), {
  ssr: true,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  ),
});

export default function AboutPage() {
  // 使用新的品牌故事頁面組件
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <BrandStoryPage />
    </Suspense>
  );
}



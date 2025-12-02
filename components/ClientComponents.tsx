"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { registerPWAInstaller } from "@/lib/utils/pwa-installer";
import { initWebVitals } from "@/lib/utils/web-vitals";

// 代碼分割優化（P1 BATCH10）：動態導入非關鍵組件
const AIChatbot = dynamic(() => import("@/components/AIChatbot"), {
  ssr: false,
  loading: () => null,
});

const InstallPWA = dynamic(() => import("@/components/InstallPWA"), {
  ssr: false,
  loading: () => null,
});

export function ClientComponents() {
  useEffect(() => {
    // 註冊 PWA 安裝器
    registerPWAInstaller();
    
    // 初始化 Web Vitals 監控（P1 BATCH12）
    initWebVitals();
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <AIChatbot />
      </Suspense>
      <Suspense fallback={null}>
        <InstallPWA />
      </Suspense>
    </>
  );
}


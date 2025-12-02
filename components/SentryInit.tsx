"use client";

import { useEffect } from "react";

/**
 * Sentry 客戶端初始化組件
 * 在客戶端動態導入 Sentry 配置
 */
export default function SentryInit() {
  useEffect(() => {
    // 動態導入 Sentry 客戶端配置
    import("../sentry.client.config");
  }, []);

  return null;
}


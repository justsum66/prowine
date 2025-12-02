"use client";

/**
 * Web Share Target API 工具函數
 * 允許其他應用分享內容到本應用
 */

/**
 * 檢查是否支持 Web Share Target
 */
export function isWebShareTargetSupported(): boolean {
  return "serviceWorker" in navigator && "share" in navigator;
}

/**
 * 處理分享目標數據
 * 在 Service Worker 中調用
 */
export function handleShareTarget(shareData: {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}): {
  title: string;
  text: string;
  url: string;
  files?: File[];
} {
  return {
    title: shareData.title || "分享的內容",
    text: shareData.text || "",
    url: shareData.url || "/",
    files: shareData.files || [],
  };
}

/**
 * 註冊 Web Share Target
 * 需要在 manifest.json 中配置
 */
export function registerWebShareTarget() {
  if (!isWebShareTargetSupported()) {
    console.warn("此瀏覽器不支持 Web Share Target");
    return;
  }

  // Web Share Target 主要通過 manifest.json 配置
  // 這裡只是提供工具函數
  console.log("[Web Share Target] 已準備就緒");
}


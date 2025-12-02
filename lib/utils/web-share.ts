"use client";

/**
 * Web Share API 工具（P1 BATCH8）
 * 實現原生分享功能
 */

export interface ShareData {
  title: string;
  text?: string;
  url: string;
}

/**
 * 檢查是否支持 Web Share API
 */
export function supportsWebShare(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator;
}

/**
 * 執行分享
 */
export async function share(data: ShareData): Promise<boolean> {
  if (!supportsWebShare()) {
    // 降級方案：複製連結到剪貼板
    try {
      await navigator.clipboard.writeText(data.url);
      return true;
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      return false;
    }
  }

  try {
    await navigator.share(data);
    return true;
  } catch (error: any) {
    // 用戶取消分享不視為錯誤
    if (error.name === "AbortError") {
      return false;
    }
    console.error("Failed to share:", error);
    return false;
  }
}

/**
 * 分享到社交媒體（降級方案）
 */
export function shareToSocial(platform: "facebook" | "twitter" | "line", url: string, text?: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text || "");

  const shareUrls: Record<string, string> = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
  };

  window.open(shareUrls[platform], "_blank", "width=600,height=400");
}


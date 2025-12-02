"use client";

/**
 * 跳轉到主要內容連結（無障礙設計）
 * 允許鍵盤用戶跳過導航直接訪問主內容
 */
export default function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      aria-label="跳轉到主要內容"
    >
      跳轉到主要內容
    </a>
  );
}


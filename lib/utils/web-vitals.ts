"use client";

/**
 * Web Vitals 監控工具（P1 BATCH12）
 * 追蹤 Core Web Vitals 指標
 */

export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  navigationType: string;
}

/**
 * 評分 Web Vitals 指標
 */
function getRating(name: string, value: number): "good" | "needs-improvement" | "poor" {
  const thresholds: Record<string, { good: number; poor: number }> = {
    CLS: { good: 0.1, poor: 0.25 },
    FID: { good: 100, poor: 300 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
    INP: { good: 200, poor: 500 },
  };

  const threshold = thresholds[name];
  if (!threshold) return "good";

  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

/**
 * 發送 Web Vitals 數據到分析服務
 */
function sendToAnalytics(metric: WebVitalsMetric) {
  // 可以發送到 Google Analytics、自定義 API 等
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", metric.name, {
      event_category: "Web Vitals",
      value: Math.round(metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // 也可以發送到自定義 API
  if (process.env.NEXT_PUBLIC_ANALYTICS_API) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metric),
      keepalive: true, // 確保請求在頁面卸載時也能發送
    }).catch(console.error);
  }

  // 開發環境輸出到控制台
  if (process.env.NODE_ENV === "development") {
    console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  }
}

/**
 * 初始化 Web Vitals 監控
 */
export function initWebVitals() {
  if (typeof window === "undefined") return;

  // 使用 setTimeout 確保在客戶端運行時才執行
  // 動態導入 web-vitals 庫（避免增加初始 bundle 大小）
  setTimeout(() => {
    const loadWebVitals = async () => {
      try {
        const webVitals = await import("web-vitals");
        // web-vitals v5 API: onFID 已被移除，使用 onINP 取代
        const { onCLS, onFCP, onLCP, onTTFB, onINP } = webVitals;
        
        if (onCLS) {
          onCLS((metric: any) => {
            sendToAnalytics({
              ...metric,
              rating: getRating("CLS", metric.value),
            });
          });
        }

        // FID 在 v5 中已被 INP 取代，但保留兼容性檢查
        if ((webVitals as any).onFID) {
          (webVitals as any).onFID((metric: any) => {
            sendToAnalytics({
              ...metric,
              rating: getRating("FID", metric.value),
            });
          });
        }

        if (onFCP) {
          onFCP((metric: any) => {
            sendToAnalytics({
              ...metric,
              rating: getRating("FCP", metric.value),
            });
          });
        }

        if (onLCP) {
          onLCP((metric: any) => {
            sendToAnalytics({
              ...metric,
              rating: getRating("LCP", metric.value),
            });
          });
        }

        if (onTTFB) {
          onTTFB((metric: any) => {
            sendToAnalytics({
              ...metric,
              rating: getRating("TTFB", metric.value),
            });
          });
        }

        if (onINP) {
          onINP((metric: any) => {
            sendToAnalytics({
              ...metric,
              rating: getRating("INP", metric.value),
            });
          });
        }
      } catch (error) {
        // 靜默失敗，不影響應用運行
        if (process.env.NODE_ENV === "development") {
          console.debug("Web Vitals not available:", error);
        }
      }
    };

    loadWebVitals();
  }, 0);
}

"use client";

/**
 * 性能監控工具（P1 BATCH12）
 * 使用 Performance API 追蹤性能指標
 */

export interface PerformanceMetrics {
  dns: number;
  tcp: number;
  request: number;
  response: number;
  dom: number;
  load: number;
  total: number;
}

/**
 * 獲取性能指標
 */
export function getPerformanceMetrics(): PerformanceMetrics | null {
  if (typeof window === "undefined" || !("performance" in window)) {
    return null;
  }

  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
  if (!navigation) return null;

  return {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    request: navigation.responseStart - navigation.requestStart,
    response: navigation.responseEnd - navigation.responseStart,
    dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
    load: navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
    total: navigation.loadEventEnd - navigation.fetchStart,
  };
}

/**
 * 獲取資源載入時間
 */
export function getResourceTimings() {
  if (typeof window === "undefined" || !("performance" in window)) {
    return [];
  }

  const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  return resources.map((resource) => ({
    name: resource.name,
    duration: resource.duration,
    size: (resource as any).transferSize || 0,
    type: resource.initiatorType,
  }));
}

/**
 * 監控長任務（Long Tasks）
 */
export function monitorLongTasks(callback: (duration: number) => void) {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          // 超過 50ms 的任務視為長任務
          callback(entry.duration);
        }
      }
    });

    observer.observe({ entryTypes: ["longtask"] });
    return () => observer.disconnect();
  } catch (error) {
    console.error("Long task monitoring not supported:", error);
  }
}

/**
 * 監控布局偏移（Layout Shift）
 */
export function monitorLayoutShift(callback: (value: number) => void) {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
    return;
  }

  try {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          callback(clsValue);
        }
      }
    });

    observer.observe({ entryTypes: ["layout-shift"] });
    return () => observer.disconnect();
  } catch (error) {
    console.error("Layout shift monitoring not supported:", error);
  }
}

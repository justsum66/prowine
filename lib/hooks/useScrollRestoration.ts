"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * 滾動恢復 Hook（P1 BATCH8）
 * 實現頁面間滾動位置恢復
 */
export function useScrollRestoration(key?: string) {
  const pathname = usePathname();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const storageKey = key || "scroll-positions";

  // 保存滾動位置
  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== "undefined") {
        scrollPositions.current.set(pathname, window.scrollY);
        // 也可以保存到 sessionStorage
        try {
          const positions = Object.fromEntries(scrollPositions.current);
          sessionStorage.setItem(storageKey, JSON.stringify(positions));
        } catch (error) {
          // 靜默失敗
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, storageKey]);

  // 恢復滾動位置
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 從 sessionStorage 恢復
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const positions = JSON.parse(saved);
        scrollPositions.current = new Map(Object.entries(positions));
      }
    } catch (error) {
      // 靜默失敗
    }

    // 恢復當前頁面的滾動位置
    const savedPosition = scrollPositions.current.get(pathname);
    if (savedPosition !== undefined) {
      // 使用 requestAnimationFrame 確保 DOM 已渲染
      requestAnimationFrame(() => {
        window.scrollTo({
          top: savedPosition,
          behavior: "auto", // 不使用 smooth，避免視覺跳躍
        });
      });
    } else {
      // 新頁面，滾動到頂部
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [pathname, storageKey]);

  // 清除特定頁面的滾動位置
  const clearPosition = (path?: string) => {
    const targetPath = path || pathname;
    scrollPositions.current.delete(targetPath);
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const positions = JSON.parse(saved);
        delete positions[targetPath];
        sessionStorage.setItem(storageKey, JSON.stringify(positions));
      }
    } catch (error) {
      // 靜默失敗
    }
  };

  return { clearPosition };
}


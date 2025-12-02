"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface WishlistItem {
  id: string;
  wineId: string;
  nameZh: string;
  nameEn: string;
  wineryName: string;
  price: number;
  imageUrl?: string;
  region?: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  isLoading: boolean;
  addItem: (wine: { id: string; nameZh?: string; nameEn?: string; wineryName?: string; price: number; imageUrl?: string; region?: string }) => Promise<void>;
  removeItem: (wineId: string) => Promise<void>;
  isInWishlist: (wineId: string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false); // 改為 false，避免初始渲染阻塞

  // 獲取或創建 sessionId
  const getSessionId = () => {
    if (typeof window === "undefined") return null;
    let sessionId = localStorage.getItem("wishlist_session_id");
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("wishlist_session_id", sessionId);
    }
    return sessionId;
  };

  // 載入願望清單
  const refreshWishlist = async () => {
    try {
      setIsLoading(true);
      const sessionId = getSessionId();
      const response = await fetch(`/api/wishlist?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      } else {
        // 如果 API 失敗，嘗試從 localStorage 載入（訪客模式）
        const stored = localStorage.getItem("guest_wishlist");
        if (stored) {
          setItems(JSON.parse(stored));
        }
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to load wishlist", error instanceof Error ? error : new Error(String(error)));
      // 失敗時從 localStorage 載入
      const stored = localStorage.getItem("guest_wishlist");
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 添加商品
  const addItem = async (wine: { id: string; nameZh?: string; nameEn?: string; wineryName?: string; price: number; imageUrl?: string; region?: string }) => {
    try {
      const sessionId = getSessionId();
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wineId: wine.id,
          sessionId,
        }),
      });

      if (response.ok) {
        await refreshWishlist();
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to add item", error instanceof Error ? error : new Error(String(error)));
    }
  };

  // 移除商品
  const removeItem = async (wineId: string) => {
    try {
      const sessionId = getSessionId();
      const response = await fetch(`/api/wishlist/${wineId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        // 如果是訪客模式，更新 localStorage
        if (data.guest) {
          const stored = localStorage.getItem("guest_wishlist") || "[]";
          const items = JSON.parse(stored).filter((item: { wineId: string }) => item.wineId !== wineId);
          localStorage.setItem("guest_wishlist", JSON.stringify(items));
          await refreshWishlist();
        } else {
          await refreshWishlist();
        }
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to remove item", error instanceof Error ? error : new Error(String(error)));
      // 失敗時從 localStorage 移除
      const stored = localStorage.getItem("guest_wishlist") || "[]";
      const items = JSON.parse(stored).filter((item: { wineId: string }) => item.wineId !== wineId);
      localStorage.setItem("guest_wishlist", JSON.stringify(items));
      await refreshWishlist();
    }
  };

  // 檢查是否在願望清單中
  const isInWishlist = (wineId: string) => {
    return items.some((item) => item.wineId === wineId);
  };

  useEffect(() => {
    // 延遲載入，避免阻塞初始渲染
    const timer = setTimeout(() => {
      refreshWishlist();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        items,
        isLoading,
        addItem,
        removeItem,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}


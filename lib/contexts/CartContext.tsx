"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface CartItem {
  id: string;
  wineId: string;
  nameZh: string;
  nameEn: string;
  wineryName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  region?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  addItem: (wine: { id: string; nameZh?: string; nameEn?: string; wineryName?: string; price: number; imageUrl?: string; region?: string }, quantity?: number) => Promise<void>;
  removeItem: (wineId: string) => Promise<void>;
  updateQuantity: (wineId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false); // 改為 false，避免初始渲染阻塞

  // 獲取或創建 sessionId
  const getSessionId = () => {
    if (typeof window === "undefined") return null;
    let sessionId = localStorage.getItem("cart_session_id");
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("cart_session_id", sessionId);
    }
    return sessionId;
  };

  // 載入購物車
  const refreshCart = async () => {
    try {
      setIsLoading(true);
      const sessionId = getSessionId();
      const response = await fetch(`/api/cart?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to load cart", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // 添加商品
  const addItem = async (wine: { id: string; nameZh?: string; nameEn?: string; wineryName?: string; price: number; imageUrl?: string; region?: string }, quantity: number = 1) => {
    try {
      const sessionId = getSessionId();
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wineId: wine.id,
          quantity,
          sessionId,
        }),
      });

      if (response.ok) {
        await refreshCart();
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
      const response = await fetch(`/api/cart/${wineId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        await refreshCart();
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to remove item", error instanceof Error ? error : new Error(String(error)));
    }
  };

  // 更新數量
  const updateQuantity = async (wineId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(wineId);
      return;
    }

    try {
      const sessionId = getSessionId();
      const response = await fetch(`/api/cart/${wineId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, sessionId }),
      });

      if (response.ok) {
        await refreshCart();
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to update quantity", error instanceof Error ? error : new Error(String(error)));
    }
  };

  // 清空購物車
  const clearCart = async () => {
    try {
      const sessionId = getSessionId();
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        await refreshCart();
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to clear cart", error instanceof Error ? error : new Error(String(error)));
    }
  };

  useEffect(() => {
    // 延遲載入，避免阻塞初始渲染
    const timer = setTimeout(() => {
      refreshCart();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}


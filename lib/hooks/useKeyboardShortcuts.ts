"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

/**
 * 鍵盤快捷鍵 Hook
 * 提供全局鍵盤快捷鍵支持
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey : !e.ctrlKey;
        const metaMatch = shortcut.meta ? e.metaKey : !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && metaMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
        }
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

/**
 * 預設鍵盤快捷鍵
 */
export function useDefaultKeyboardShortcuts() {
  const router = useRouter();

  useKeyboardShortcuts([
    {
      key: "k",
      ctrl: true,
      action: () => {
        // 觸發搜索（需要通過事件或狀態管理）
        const event = new CustomEvent("openSearch");
        window.dispatchEvent(event);
      },
      description: "開啟搜索",
    },
    {
      key: "/",
      action: () => {
        const event = new CustomEvent("openSearch");
        window.dispatchEvent(event);
      },
      description: "開啟搜索",
    },
    {
      key: "h",
      ctrl: true,
      action: () => {
        router.push("/");
      },
      description: "返回首頁",
    },
    {
      key: "w",
      ctrl: true,
      action: () => {
        router.push("/wines");
      },
      description: "前往酒款頁面",
    },
    {
      key: "b",
      ctrl: true,
      action: () => {
        router.push("/wineries");
      },
      description: "前往酒莊頁面",
    },
  ]);
}

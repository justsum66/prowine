/**
 * 生產環境安全保護組件
 * 防止代碼洩露、信息洩露和逆向工程
 */

"use client";

import { useEffect } from "react";

export default function ProductionSecurity() {
  useEffect(() => {
    // 僅在生產環境執行
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    // 1. 清理 console（保留 error 和 warn）
    const originalConsole = { ...console };
    const noop = () => {};
    
    // 清理所有 console 方法（除了 error 和 warn）
    (["log", "debug", "info", "table", "trace", "group", "groupEnd", "time", "timeEnd"] as const).forEach((method) => {
      try {
        (console as any)[method] = noop;
      } catch (e) {
        // 忽略無法覆蓋的方法
      }
    });

    // 2. 防止 React DevTools
    try {
      const noop = () => {};
      Object.defineProperty(window, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
        get: () => undefined,
        set: noop,
        configurable: false,
      });
    } catch (e) {
      // 忽略錯誤
    }

    // 3. 防止調試工具
    let devtools = false;
    const element = new Image();
    Object.defineProperty(element, "id", {
      get: function () {
        devtools = true;
        return "";
      },
    });

    const checkDevTools = setInterval(() => {
      devtools = false;
      console.log(element);
      if (devtools) {
        // 檢測到開發者工具，可以採取行動（如重定向或警告）
        // 但為了不影響正常用戶體驗，這裡只清除控制台
        console.clear();
      }
    }, 1000);

    // 4. 清理錯誤堆棧中的敏感信息
    const originalErrorHandler = window.onerror;
    window.onerror = function (message, source, lineno, colno, error) {
      // 清理錯誤堆棧中的文件路徑信息
      if (error && error.stack) {
        error.stack = error.stack
          .replace(/at .*?\(.*?\.map\)/g, "") // 移除 .map 引用
          .replace(/@.*?\.map/g, "") // 移除 source map 引用
          .replace(/webpack-internal.*/g, "") // 移除 webpack 內部信息
          .replace(/__webpack.*/g, "") // 移除 webpack 模塊信息
          .replace(/\.next\/.*/g, "") // 移除 Next.js 內部路徑
          .replace(/node_modules\/.*/g, ""); // 移除 node_modules 路徑
      }

      if (originalErrorHandler) {
        return originalErrorHandler.call(window, message, source, lineno, colno, error);
      }
      return false;
    };

    // 5. 禁用右鍵菜單（可選，但可能影響用戶體驗）
    // document.addEventListener("contextmenu", (e) => e.preventDefault());

    // 6. 禁用文本選擇（可選，但可能影響用戶體驗）
    // document.addEventListener("selectstart", (e) => e.preventDefault());

    // 7. 禁用 F12、Ctrl+Shift+I 等快捷鍵（可選，但可能影響用戶體驗）
    // document.addEventListener("keydown", (e) => {
    //   if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
    //     e.preventDefault();
    //   }
    // });

    return () => {
      clearInterval(checkDevTools);
      // 恢復原始錯誤處理器
      window.onerror = originalErrorHandler;
      // 恢復 console（如果需要）
      Object.assign(console, originalConsole);
    };
  }, []);

  return null; // 此組件不渲染任何內容
}


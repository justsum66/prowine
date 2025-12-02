"use client";

import { useEffect } from "react";

/**
 * 無障礙設計輔助組件（P1 BATCH18）
 * 提供跳轉鏈接、焦點管理等功能
 */

/**
 * 跳轉到主要內容鏈接
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        fixed top-4 left-4 z-50
        px-4 py-2
        bg-primary-600 text-white
        rounded-lg
        font-medium
        shadow-lg
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        transition-all
      "
    >
      跳轉到主要內容
    </a>
  );
}

/**
 * 焦點管理 Hook
 */
export function useFocusManagement(isOpen: boolean, focusElement?: HTMLElement | null) {
  useEffect(() => {
    if (!isOpen) return;

    // 保存當前焦點
    const previousActiveElement = document.activeElement as HTMLElement;

    // 聚焦到指定元素
    if (focusElement) {
      focusElement.focus();
    }

    // 恢復焦點
    return () => {
      previousActiveElement?.focus();
    };
  }, [isOpen, focusElement]);
}

/**
 * 焦點陷阱 Hook（用於模態框）
 */
export function useFocusTrap(isOpen: boolean, containerRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // 聚焦第一個元素
    firstElement.focus();

    container.addEventListener("keydown", handleTab);
    return () => container.removeEventListener("keydown", handleTab);
  }, [isOpen, containerRef]);
}

/**
 * ARIA Live Region 組件（用於屏幕閱讀器）（P1 BATCH19）
 */
interface LiveRegionProps {
  message: string;
  priority?: "polite" | "assertive";
  className?: string;
}

export function LiveRegion({ message, priority = "polite", className = "" }: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  );
}

/**
 * 表單錯誤摘要組件（P1 BATCH19）
 * 用於顯示表單驗證錯誤的摘要
 */
interface FormErrorSummaryProps {
  errors: Record<string, string>;
  id?: string;
  className?: string;
}

export function FormErrorSummary({ errors, id = "form-errors", className = "" }: FormErrorSummaryProps) {
  const errorEntries = Object.entries(errors);
  
  if (errorEntries.length === 0) {
    return null;
  }

  return (
    <div
      id={id}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`
        p-4 rounded-lg
        bg-red-50 dark:bg-red-900/20
        border border-red-200 dark:border-red-800
        ${className}
      `}
    >
      <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
        請修正以下錯誤：
      </h3>
      <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-300">
        {errorEntries.map(([field, message]) => (
          <li key={field}>
            <a
              href={`#${field}`}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(field);
                element?.focus();
                element?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}


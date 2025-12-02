/**
 * 搜尋結果高亮組件
 * 已統一使用 highlight-text.tsx 中的 highlightText 函數
 * 此文件保留以維持向後兼容性，但建議遷移到 highlight-text.tsx
 */

import { highlightText } from "./highlight-text";

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightText({ text, query, className = "" }: HighlightTextProps) {
  // 使用統一的 highlightText 函數
  return (
    <>
      {highlightText(text, query, {
        className,
        highlightClassName: "bg-accent-gold/30 text-neutral-900 font-medium px-0.5 rounded",
      })}
    </>
  );
}


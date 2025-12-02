/**
 * 文本高亮工具（P1 BATCH14）
 * 用於搜索結果中高亮顯示關鍵字
 */

import React from "react";

export interface HighlightOptions {
  caseSensitive?: boolean;
  className?: string;
  highlightClassName?: string;
}

/**
 * 高亮文本中的關鍵字
 */
export function highlightText(
  text: string,
  keywords: string | string[],
  options: HighlightOptions = {}
): React.ReactNode {
  const {
    caseSensitive = false,
    className = "",
    highlightClassName = "bg-accent-gold/30 text-neutral-900 font-medium",
  } = options;

  if (!text || !keywords) {
    return <span className={className}>{text}</span>;
  }

  const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
  if (keywordArray.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // 構建正則表達式
  const pattern = keywordArray
    .filter((k) => k.trim().length > 0)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  if (!pattern) {
    return <span className={className}>{text}</span>;
  }

  const regex = new RegExp(`(${pattern})`, caseSensitive ? "g" : "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = keywordArray.some((keyword) => {
          const comparison = caseSensitive
            ? part === keyword
            : part.toLowerCase() === keyword.toLowerCase();
          return comparison;
        });

        return isMatch ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
}

/**
 * 高亮文本（返回 HTML 字符串，用於 dangerouslySetInnerHTML）
 */
export function highlightTextHTML(
  text: string,
  keywords: string | string[],
  options: HighlightOptions = {}
): string {
  const {
    caseSensitive = false,
    highlightClassName = "bg-accent-gold/30 text-neutral-900 font-medium",
  } = options;

  if (!text || !keywords) {
    return text;
  }

  const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
  if (keywordArray.length === 0) {
    return text;
  }

  const pattern = keywordArray
    .filter((k) => k.trim().length > 0)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  if (!pattern) {
    return text;
  }

  const regex = new RegExp(`(${pattern})`, caseSensitive ? "g" : "gi");
  return text.replace(
    regex,
    `<mark class="${highlightClassName}">$1</mark>`
  );
}


/**
 * 模糊搜尋工具（P2）
 * 實現模糊匹配算法
 */

import React from "react";

/**
 * 計算兩個字符串的相似度（Levenshtein 距離）
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // 初始化矩陣
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // 填充矩陣
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // 刪除
          matrix[i][j - 1] + 1, // 插入
          matrix[i - 1][j - 1] + 1 // 替換
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * 計算相似度分數（0-1）
 */
function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
}

/**
 * 檢查是否包含關鍵字（部分匹配）
 */
function containsKeyword(text: string, keyword: string): boolean {
  return text.toLowerCase().includes(keyword.toLowerCase());
}

/**
 * 模糊搜尋結果
 */
export interface FuzzySearchResult<T> {
  item: T;
  score: number;
  matches: {
    field: string;
    value: string;
    score: number;
  }[];
}

/**
 * 執行模糊搜尋
 */
export function fuzzySearch<T extends Record<string, any>>(
  items: T[],
  query: string,
  searchFields: (keyof T)[],
  options?: {
    minScore?: number;
    maxResults?: number;
    caseSensitive?: boolean;
  }
): FuzzySearchResult<T>[] {
  if (!query.trim()) {
    return items.slice(0, options?.maxResults || 10).map((item) => ({
      item,
      score: 1,
      matches: [],
    }));
  }

  const { minScore = 0.3, maxResults = 10, caseSensitive = false } = options || {};
  const normalizedQuery = caseSensitive ? query : query.toLowerCase();

  const results: FuzzySearchResult<T>[] = [];

  for (const item of items) {
    let totalScore = 0;
    const matches: { field: string; value: string; score: number }[] = [];

    for (const field of searchFields) {
      const value = item[field];
      if (!value) continue;

      const fieldValue = caseSensitive ? String(value) : String(value).toLowerCase();

      // 完全匹配（最高分）
      if (fieldValue === normalizedQuery) {
        totalScore += 1;
        matches.push({ field: String(field), value: String(value), score: 1 });
      }
      // 包含關鍵字（高分）
      else if (containsKeyword(fieldValue, normalizedQuery)) {
        const score = 0.7 + (normalizedQuery.length / fieldValue.length) * 0.3;
        totalScore += score;
        matches.push({ field: String(field), value: String(value), score });
      }
      // 模糊匹配（中等分）
      else {
        const score = similarityScore(fieldValue, normalizedQuery);
        if (score >= minScore) {
          totalScore += score * 0.5;
          matches.push({ field: String(field), value: String(value), score: score * 0.5 });
        }
      }
    }

    // 計算平均分
    const avgScore = matches.length > 0 ? totalScore / matches.length : 0;

    if (avgScore >= minScore) {
      results.push({
        item,
        score: avgScore,
        matches,
      });
    }
  }

  // 按分數排序
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, maxResults);
}

/**
 * 高亮搜尋關鍵字
 */
export function highlightMatches(
  text: string,
  query: string,
  className: string = "bg-yellow-200 dark:bg-yellow-900/50"
): React.ReactNode[] {
  if (!query.trim()) return [text];

  // 轉義特殊字符
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedQuery})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch = regex.test(part);
    // 重置 regex 的 lastIndex
    regex.lastIndex = 0;
    return isMatch ? (
      <span key={index} className={className}>
        {part}
      </span>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    );
  });
}

/**
 * 簡單的模糊匹配檢查（用於 API）
 */
export function fuzzyMatch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  
  // 完全匹配
  if (normalizedText === normalizedQuery) return true;
  
  // 包含匹配
  if (normalizedText.includes(normalizedQuery)) return true;
  
  // 模糊匹配（相似度 > 0.5）
  const score = similarityScore(normalizedText, normalizedQuery);
  return score >= 0.5;
}

/**
 * 計算相關性分數（用於 API）
 */
export function calculateRelevanceScore(
  item: { nameZh?: string; nameEn?: string; region?: string },
  query: string
): number {
  if (!query.trim()) return 0;
  
  const normalizedQuery = query.toLowerCase();
  let score = 0;
  
  // 中文名稱匹配
  if (item.nameZh) {
    const nameZh = item.nameZh.toLowerCase();
    if (nameZh === normalizedQuery) score += 10;
    else if (nameZh.includes(normalizedQuery)) score += 7;
    else {
      const sim = similarityScore(nameZh, normalizedQuery);
      if (sim >= 0.5) score += sim * 5;
    }
  }
  
  // 英文名稱匹配
  if (item.nameEn) {
    const nameEn = item.nameEn.toLowerCase();
    if (nameEn === normalizedQuery) score += 10;
    else if (nameEn.includes(normalizedQuery)) score += 7;
    else {
      const sim = similarityScore(nameEn, normalizedQuery);
      if (sim >= 0.5) score += sim * 5;
    }
  }
  
  // 產區匹配
  if (item.region) {
    const region = item.region.toLowerCase();
    if (region === normalizedQuery) score += 5;
    else if (region.includes(normalizedQuery)) score += 3;
  }
  
  return score;
}
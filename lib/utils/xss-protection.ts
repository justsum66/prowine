/**
 * XSS 防護工具
 * 用於清理用戶輸入，防止跨站腳本攻擊
 */

/**
 * HTML 實體編碼映射
 */
const HTML_ENTITIES: { [key: string]: string } = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * 編碼 HTML 特殊字符
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  return text.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * 清理 HTML 標籤（保留安全標籤）
 */
export function sanitizeHtml(html: string, allowedTags: string[] = []): string {
  if (typeof html !== 'string') {
    return '';
  }

  // 基本標籤清理（移除所有標籤，除非在允許列表中）
  let sanitized = html;
  
  // 移除所有 <script> 標籤
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // 移除所有 on* 事件處理器
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // 移除 javascript: 協議
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // 移除 data: URI（可能包含惡意代碼）
  sanitized = sanitized.replace(/data:\s*text\/html/gi, '');
  
  // 如果沒有指定允許的標籤，則移除所有 HTML 標籤
  if (allowedTags.length === 0) {
    sanitized = sanitized.replace(/<[^>]+>/g, '');
  } else {
    // 只保留允許的標籤
    const allowedTagsStr = allowedTags.join('|');
    const regex = new RegExp(`<(?!\/?(?:${allowedTagsStr})(?:\s|>))[^>]+>`, 'gi');
    sanitized = sanitized.replace(regex, '');
  }
  
  return sanitized;
}

/**
 * 驗證 URL 是否安全
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }

  // 移除 javascript: 協議
  let sanitized = url.replace(/^javascript:/i, '');
  
  // 移除 data: URI（除了常見的圖片格式）
  sanitized = sanitized.replace(/^data:(?!image\/(png|jpeg|gif|webp))/i, '');
  
  // 確保 URL 以 http:// 或 https:// 開頭
  if (sanitized && !sanitized.match(/^(https?|mailto|tel):/i)) {
    sanitized = '';
  }
  
  return sanitized;
}

/**
 * 清理用戶輸入（通用方法）
 */
export function sanitizeInput(input: any, type: 'text' | 'html' | 'url' = 'text'): string {
  if (input === null || input === undefined) {
    return '';
  }

  const str = String(input).trim();

  switch (type) {
    case 'html':
      return sanitizeHtml(str);
    case 'url':
      return sanitizeUrl(str);
    case 'text':
    default:
      return escapeHtml(str);
  }
}

/**
 * 清理對象中的所有字符串字段
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fields: { [key: string]: 'text' | 'html' | 'url' }
): T {
  const sanitized = { ...obj } as T;

  for (const [field, type] of Object.entries(fields)) {
    if (sanitized[field as keyof T] !== undefined && sanitized[field as keyof T] !== null) {
      (sanitized as Record<string, any>)[field] = sanitizeInput(sanitized[field as keyof T], type);
    }
  }

  return sanitized;
}


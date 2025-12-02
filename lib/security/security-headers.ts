/**
 * 企業級安全標頭配置
 * 提供全面的安全標頭設置，防止常見的網絡攻擊
 */

import { NextResponse } from "next/server";

export interface SecurityHeadersConfig {
  // CSP (Content Security Policy)
  enableCSP?: boolean;
  cspDirectives?: Record<string, string[]>;
  
  // HSTS (HTTP Strict Transport Security)
  enableHSTS?: boolean;
  hstsMaxAge?: number;
  hstsIncludeSubDomains?: boolean;
  hstsPreload?: boolean;
  
  // 其他安全標頭
  enableXFrameOptions?: boolean;
  enableXContentTypeOptions?: boolean;
  enableXSSProtection?: boolean;
  enableReferrerPolicy?: boolean;
  enablePermissionsPolicy?: boolean;
  
  // 開發環境配置
  isDevelopment?: boolean;
}

const DEFAULT_CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'", // Next.js 需要
    "'unsafe-eval'", // Next.js 開發模式需要
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'", // Tailwind CSS 需要
    "https://fonts.googleapis.com",
  ],
  "font-src": [
    "'self'",
    "https://fonts.gstatic.com",
    "data:",
  ],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https:",
    "http://prowine.com.tw",
  ],
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    "https://api.resend.com",
    "https://api.groq.com",
    "https://generativelanguage.googleapis.com",
    "https://openrouter.ai",
    "https://api.cloudinary.com",
    "https://www.google-analytics.com",
  ],
  "frame-src": [
    "'self'",
    "https://www.google.com",
  ],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": [],
};

/**
 * 構建 CSP 標頭值
 */
function buildCSPHeader(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(" ")}`;
    })
    .join("; ");
}

/**
 * 應用安全標頭到響應
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = {}
): NextResponse {
  const {
    enableCSP = true,
    cspDirectives = DEFAULT_CSP_DIRECTIVES,
    enableHSTS = true,
    hstsMaxAge = 31536000, // 1 年
    hstsIncludeSubDomains = true,
    hstsPreload = false,
    enableXFrameOptions = true,
    enableXContentTypeOptions = true,
    enableXSSProtection = true,
    enableReferrerPolicy = true,
    enablePermissionsPolicy = true,
    isDevelopment = process.env.NODE_ENV === "development",
  } = config;

  // Content Security Policy (CSP)
  if (enableCSP && !isDevelopment) {
    // 生產環境使用嚴格 CSP
    const cspValue = buildCSPHeader(cspDirectives);
    response.headers.set("Content-Security-Policy", cspValue);
  } else if (enableCSP && isDevelopment) {
    // 開發環境使用較寬鬆的 CSP
    const devCSP = {
      ...cspDirectives,
      "script-src": [
        ...cspDirectives["script-src"] || [],
        "'unsafe-eval'", // 開發模式需要
      ],
    };
    const cspValue = buildCSPHeader(devCSP);
    response.headers.set("Content-Security-Policy", cspValue);
  }

  // HTTP Strict Transport Security (HSTS)
  if (enableHSTS && !isDevelopment) {
    let hstsValue = `max-age=${hstsMaxAge}`;
    if (hstsIncludeSubDomains) {
      hstsValue += "; includeSubDomains";
    }
    if (hstsPreload) {
      hstsValue += "; preload";
    }
    response.headers.set("Strict-Transport-Security", hstsValue);
  }

  // X-Frame-Options (防止點擊劫持)
  if (enableXFrameOptions) {
    response.headers.set("X-Frame-Options", "DENY");
  }

  // X-Content-Type-Options (防止 MIME 類型嗅探)
  if (enableXContentTypeOptions) {
    response.headers.set("X-Content-Type-Options", "nosniff");
  }

  // X-XSS-Protection (舊版瀏覽器 XSS 防護)
  if (enableXSSProtection) {
    response.headers.set("X-XSS-Protection", "1; mode=block");
  }

  // Referrer-Policy (控制 referrer 信息)
  if (enableReferrerPolicy) {
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }

  // Permissions-Policy (控制瀏覽器功能)
  if (enablePermissionsPolicy) {
    const permissions = [
      "geolocation=()",
      "microphone=()",
      "camera=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      // 移除 speaker（某些瀏覽器不支持）
    ].join(", ");
    response.headers.set("Permissions-Policy", permissions);
  }
  
  // 防止代碼洩露：移除敏感響應頭
  response.headers.delete("X-Powered-By");
  response.headers.delete("Server");
  response.headers.delete("X-AspNet-Version");
  response.headers.delete("X-AspNetMvc-Version");
  
  // 添加額外安全標頭
  response.headers.set("X-Download-Options", "noopen");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");

  // 移除 X-Powered-By (如果 Next.js 沒有自動移除)
  response.headers.delete("X-Powered-By");

  // 添加安全相關的自定義標頭
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-DNS-Prefetch-Control", "on");

  return response;
}

/**
 * 創建帶有安全標頭的響應
 */
export function createSecureResponse(
  body: BodyInit | null,
  init?: ResponseInit
): NextResponse {
  const response = new NextResponse(body, init);
  return applySecurityHeaders(response);
}


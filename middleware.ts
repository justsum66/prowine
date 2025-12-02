import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { applySecurityHeaders } from '@/lib/security/security-headers';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 處理靜態資源 404 錯誤（靜默處理，避免日誌噪音）
  if (pathname === '/sw.js') {
    const response = new NextResponse('// Service worker not implemented', {
      status: 404,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    return applySecurityHeaders(response, { isDevelopment: process.env.NODE_ENV === 'development' });
  }

  // 處理視頻文件 404
  if (pathname.startsWith('/videos/hero-video')) {
    const response = new NextResponse(null, { status: 404 });
    return applySecurityHeaders(response, { isDevelopment: process.env.NODE_ENV === 'development' });
  }

  // 處理 manifest.webmanifest（重定向到 manifest.json）
  if (pathname === '/manifest.webmanifest') {
    const response = NextResponse.redirect(new URL('/manifest.json', request.url), 301);
    return applySecurityHeaders(response, { isDevelopment: process.env.NODE_ENV === 'development' });
  }

  // 處理字體文件 404（Next.js 字體自動處理，不應該直接請求）
  if (pathname.includes('/fonts/') && pathname.endsWith('.woff2')) {
    const response = new NextResponse(null, { status: 404 });
    return applySecurityHeaders(response, { isDevelopment: process.env.NODE_ENV === 'development' });
  }

  // 處理知識分類路由（防止 404）
  if (pathname.startsWith('/knowledge/') && pathname !== '/knowledge') {
    const response = NextResponse.next();
    return applySecurityHeaders(response, { isDevelopment: process.env.NODE_ENV === 'development' });
  }

  const response = NextResponse.next();

  // 強制禁用快取（開發環境）
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Accel-Expires', '0');
  }

  // 應用企業級安全標頭
  return applySecurityHeaders(response, { isDevelopment: process.env.NODE_ENV === 'development' });
}

export const config = {
  matcher: [
    // 匹配所有路徑以禁用快取
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};


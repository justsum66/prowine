'use client';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function registerPWAInstaller() {
  if (typeof window === 'undefined') return;

  // 只在生產環境註冊 Service Worker
  // 開發模式下 Next.js 無法正確提供 ServiceWorker 檔案
  const hostname = window.location.hostname;
  const isDevelopment = hostname === 'localhost' || 
                        hostname === '127.0.0.1' ||
                        hostname.startsWith('192.168.') ||
                        hostname.startsWith('10.') ||
                        (process.env.NEXT_PUBLIC_NODE_ENV === 'development');

  if (isDevelopment) {
    // 開發模式下取消註冊已存在的 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().then((success) => {
            if (success) {
              console.log('[PWA] 開發模式：已取消註冊 Service Worker');
            }
          });
        });
      });
    }
    return;
  }

  // 註冊 Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker 註冊成功:', registration.scope);

          // 檢查更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 有新版本可用
                  console.log('[PWA] 新版本可用');
                  if (confirm('發現新版本，是否重新載入？')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker 註冊失敗:', error);
        });
    });
  }

  // 攔截「添加到主畫面」提示
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA] 準備安裝提示');
  });
}

export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] 無法顯示安裝提示');
    return false;
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('[PWA] 用戶接受安裝');
    } else {
      console.log('[PWA] 用戶拒絕安裝');
    }
    
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] 安裝提示失敗:', error);
    return false;
  }
}

export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // 檢查是否以獨立模式運行
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  return isStandalone || isIOSStandalone;
}

export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null;
}


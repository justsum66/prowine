'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  isPWAInstalled, 
  isInstallPromptAvailable, 
  showInstallPrompt 
} from '@/lib/utils/pwa-installer';

export default function InstallPWA() {
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // 檢查是否已安裝
    if (isPWAInstalled()) {
      setInstalled(true);
      return;
    }

    // 檢查是否可用
    const checkAvailability = () => {
      const available = isInstallPromptAvailable();
      setAvailable(available);
      
      // 如果可用且未顯示過，3秒後顯示提示
      if (available) {
        const hasShown = localStorage.getItem('pwa-install-shown');
        if (!hasShown) {
          setTimeout(() => {
            setShow(true);
            localStorage.setItem('pwa-install-shown', 'true');
          }, 3000);
        }
      }
    };

    // 立即檢查
    checkAvailability();

    // 定期檢查（因為 beforeinstallprompt 可能延遲觸發）
    const interval = setInterval(checkAvailability, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    const success = await showInstallPrompt();
    if (success) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // 記住用戶選擇，24小時內不再顯示
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (installed || !available || !show) {
    return null;
  }

  // 檢查是否在24小時內被拒絕
  const dismissed = localStorage.getItem('pwa-install-dismissed');
  if (dismissed) {
    const dismissedTime = parseInt(dismissed, 10);
    const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
    if (hoursSinceDismissed < 24) {
      return null;
    } else {
      // 超過24小時，清除記錄
      localStorage.removeItem('pwa-install-dismissed');
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 lg:left-auto lg:right-4 lg:w-96"
      >
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 p-4 flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              安裝 ProWine App
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              將 ProWine 添加到主畫面，享受更快的載入速度和離線瀏覽體驗。
            </p>
          </div>
          
          <div className="flex items-start gap-2">
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              安裝
            </button>
            
            <button
              onClick={handleDismiss}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
              aria-label="關閉"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}


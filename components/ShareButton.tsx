"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { share, shareToSocial, supportsWebShare } from "@/lib/utils/web-share";
import { useHapticFeedback } from "@/lib/hooks/useHapticFeedback";
import { useToast as useToastHook } from "@/components/Toast";

interface ShareButtonProps {
  title: string;
  url: string;
  text?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

/**
 * 分享按鈕組件（P1 BATCH8）
 * 支持 Web Share API 和社交媒體分享
 */
export default function ShareButton({
  title,
  url,
  text,
  className = "",
  size = "md",
  showLabel = false,
}: ShareButtonProps) {
  const [isShared, setIsShared] = useState(false);
  const [showSocialMenu, setShowSocialMenu] = useState(false);
  const { trigger } = useHapticFeedback();
  const toast = useToastHook();

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleShare = async () => {
    trigger({ type: "medium" });

    if (supportsWebShare()) {
      const success = await share({ title, text, url });
      if (success) {
        setIsShared(true);
        toast.success("分享成功！");
        setTimeout(() => setIsShared(false), 2000);
      }
    } else {
      // 顯示社交媒體選項
      setShowSocialMenu(!showSocialMenu);
    }
  };

  const handleSocialShare = (platform: "facebook" | "twitter" | "line") => {
    trigger({ type: "light" });
    shareToSocial(platform, url, text);
    setShowSocialMenu(false);
    setIsShared(true);
    toast.info("已開啟分享視窗");
    setTimeout(() => setIsShared(false), 2000);
  };

  return (
    <div className="relative">
      <motion.button
        onClick={handleShare}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          bg-white/95 dark:bg-neutral-800/95
          backdrop-blur-sm
          rounded-full
          hover:bg-white dark:hover:bg-neutral-700
          transition-colors
          shadow-lg border border-neutral-200 dark:border-neutral-700
          ${className}
        `}
        aria-label="分享"
      >
        <AnimatePresence mode="wait">
          {isShared ? (
            <motion.div
              key="check"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <Check className={`${iconSizes[size]} text-green-500`} />
            </motion.div>
          ) : (
            <motion.div
              key="share"
              initial={{ scale: 1 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Share2 className={`${iconSizes[size]} text-neutral-700 dark:text-neutral-300`} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* 社交媒體選單（降級方案） */}
      <AnimatePresence>
        {showSocialMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowSocialMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute bottom-full right-0 mb-2 z-50 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 p-2 min-w-[120px]"
            >
              <button
                onClick={() => handleSocialShare("facebook")}
                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
              >
                Facebook
              </button>
              <button
                onClick={() => handleSocialShare("twitter")}
                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
              >
                Twitter
              </button>
              <button
                onClick={() => handleSocialShare("line")}
                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
              >
                LINE
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}


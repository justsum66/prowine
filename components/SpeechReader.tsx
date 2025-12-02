"use client";

import { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 語音閱讀支持組件
 * 使用 Web Speech API 提供文本到語音功能
 */
export default function SpeechReader() {
  const [isSupported, setIsSupported] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  const readText = () => {
    if (!speechSynthesis || !isSupported) {
      return;
    }

    // 停止當前閱讀
    if (isReading) {
      speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    // 獲取頁面主要文本內容
    const mainContent = document.getElementById("main-content");
    if (!mainContent) {
      return;
    }

    // 提取文本（排除腳本和樣式）
    const text = mainContent.innerText
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 5000); // 限制長度

    if (!text) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-TW";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsReading(true);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    speechSynthesis.speak(utterance);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={readText}
      className="fixed bottom-24 right-4 z-50 p-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label={isReading ? "停止語音閱讀" : "開始語音閱讀"}
      title={isReading ? "停止語音閱讀" : "開始語音閱讀"}
    >
      <AnimatePresence mode="wait">
        {isReading ? (
          <motion.div
            key="stop"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
          >
            <VolumeX className="w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="play"
            initial={{ opacity: 0, rotate: 90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: -90 }}
          >
            <Volume2 className="w-5 h-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}


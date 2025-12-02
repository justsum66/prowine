"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, X } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["Ctrl", "K"], description: "開啟搜索" },
  { keys: ["/"], description: "開啟搜索" },
  { keys: ["Ctrl", "H"], description: "返回首頁" },
  { keys: ["Ctrl", "W"], description: "前往酒款頁面" },
  { keys: ["Ctrl", "B"], description: "前往酒莊頁面" },
  { keys: ["Esc"], description: "關閉模態框/返回" },
];

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "?") {
        e.preventDefault();
        setShowHelp(true);
      }
      if (e.key === "Escape" && showHelp) {
        setShowHelp(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showHelp]);

  return (
    <>
      {/* 快捷鍵幫助按鈕 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowHelp(true)}
        className="fixed bottom-24 right-4 z-40 p-3 bg-white dark:bg-neutral-800 rounded-full shadow-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 md:hidden"
        aria-label="顯示鍵盤快捷鍵幫助"
      >
        <Keyboard className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
      </motion.button>

      {/* 快捷鍵幫助模態框 */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHelp(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="keyboard-shortcuts-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                <h2
                  id="keyboard-shortcuts-title"
                  className="text-xl font-serif font-semibold text-neutral-900 dark:text-neutral-100"
                >
                  鍵盤快捷鍵
                </h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="關閉"
                >
                  <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>
              <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0"
                  >
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <kbd className="px-2 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded border border-neutral-300 dark:border-neutral-600">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-neutral-400 mx-1">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                  按 <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-600">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-600">?</kbd> 隨時查看此幫助
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


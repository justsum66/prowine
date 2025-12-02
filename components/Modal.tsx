"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useHapticFeedback } from "@/lib/hooks/useHapticFeedback";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

/**
 * 模態框組件（P1 BATCH7）
 * 實現淡入動畫、背景模糊、點擊外部關閉等功能
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
  closeOnClickOutside = true,
  closeOnEscape = true,
  className = "",
}: ModalProps) {
  const { trigger } = useHapticFeedback();
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC 鍵關閉（P1 BATCH7）
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        trigger({ type: "light" });
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose, trigger]);

  // 點擊外部關閉（P1 BATCH7）
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnClickOutside && e.target === e.currentTarget) {
      trigger({ type: "light" });
      onClose();
    }
  };

  // 焦點陷阱（無障礙）
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    firstElement?.focus();
    modal.addEventListener("keydown", handleTab);
    return () => modal.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "modal-title" : undefined}
        >
          {/* 背景模糊層（P1 BATCH7） */}
          <motion.div
            initial={{ backdropFilter: "blur(0px)" }}
            animate={{ backdropFilter: "blur(8px)" }}
            exit={{ backdropFilter: "blur(0px)" }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* 模態框內容 */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            onClick={(e) => e.stopPropagation()}
            className={`
              relative w-full ${sizeClasses[size]}
              bg-white dark:bg-neutral-800
              rounded-2xl shadow-2xl
              max-h-[90vh] overflow-auto
              ${className}
            `}
          >
            {/* 標題欄 */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
                {title && (
                  <h2 id="modal-title" className="text-2xl font-serif font-light text-neutral-900 dark:text-neutral-100">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <button
                    onClick={() => {
                      trigger({ type: "light" });
                      onClose();
                    }}
                    className="
                      p-2 rounded-lg
                      text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300
                      hover:bg-neutral-100 dark:hover:bg-neutral-700
                      transition-colors
                      min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto]
                      focus:outline-none focus:ring-2 focus:ring-primary-500
                    "
                    aria-label="關閉"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            
            {/* 內容 */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


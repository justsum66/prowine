"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";

interface AnchorSection {
  id: string;
  label: string;
}

interface ScrollAnchorNavProps {
  sections: AnchorSection[];
  className?: string;
}

/**
 * 滾動錨點導航組件（P2）
 * 粘性導航欄，顯示當前閱讀位置指示器
 */
export default function ScrollAnchorNav({
  sections,
  className = "",
}: ScrollAnchorNavProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");
  const [isVisible, setIsVisible] = useState(false);

  // 監聽滾動位置
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // 當滾動超過 200px 時顯示導航
      setIsVisible(scrollY > 200);

      // 找到當前可見的區塊
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= windowHeight * 0.3) {
            setActiveSection(sections[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      const offset = 100; // 粘性導航欄高度
      const y = section.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  if (!isVisible || sections.length === 0) return null;

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className={`
        fixed top-0 left-0 right-0 z-40
        bg-white/95 dark:bg-neutral-900/95
        backdrop-blur-sm
        border-b border-neutral-200 dark:border-neutral-700
        shadow-sm
        ${className}
      `}
    >
      <div className="container-custom">
        <div 
          className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            touchAction: "pan-x",
          }}
        >
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`
                relative px-4 py-3
                text-sm font-medium
                whitespace-nowrap
                transition-colors
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                touch-manipulation
                min-h-[44px]
                min-w-[44px]
                ${
                  activeSection === section.id
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }
              `}
              style={{
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
              }}
              aria-label={`跳轉到 ${section.label} 區塊`}
            >
              {section.label}
              {activeSection === section.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}


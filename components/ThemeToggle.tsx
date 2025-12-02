"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <motion.div 
      className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1 transition-colors duration-300"
      initial={false}
      animate={{ backgroundColor: resolvedTheme === "dark" ? "rgba(38, 38, 38, 0.8)" : "rgba(245, 245, 245, 0.8)" }}
      transition={{ duration: 0.3 }}
    >
      <motion.button
        onClick={() => setTheme("light")}
        className={`p-2 rounded transition-all duration-300 min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 ${
          theme === "light"
            ? "bg-white dark:bg-neutral-700 text-primary-600 dark:text-accent-gold shadow-sm"
            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
        }`}
        aria-label="淺色模式"
        aria-pressed={theme === "light"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: theme === "light" ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <Sun className="w-4 h-4" />
        </motion.div>
      </motion.button>
      <motion.button
        onClick={() => setTheme("dark")}
        className={`p-2 rounded transition-all duration-300 min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 ${
          theme === "dark"
            ? "bg-white dark:bg-neutral-700 text-primary-600 dark:text-accent-gold shadow-sm"
            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
        }`}
        aria-label="深色模式"
        aria-pressed={theme === "dark"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div
          animate={{ rotate: theme === "dark" ? 0 : -180 }}
          transition={{ duration: 0.3 }}
        >
          <Moon className="w-4 h-4" />
        </motion.div>
      </motion.button>
      <motion.button
        onClick={() => setTheme("system")}
        className={`p-2 rounded transition-all duration-300 min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 ${
          theme === "system"
            ? "bg-white dark:bg-neutral-700 text-primary-600 dark:text-accent-gold shadow-sm"
            : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
        }`}
        aria-label="跟隨系統"
        aria-pressed={theme === "system"}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Monitor className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}


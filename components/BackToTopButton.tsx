"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { createButtonProps } from "@/lib/utils/button-props";

export default function BackToTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          {...createButtonProps(scrollToTop, {
            className: "fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 w-12 h-12 md:w-14 md:h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2",
            "aria-label": "返回頂部",
          })}
        >
          <ArrowUp className="w-5 h-5 md:w-6 md:h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}


"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  baseUrl?: string;
  showInfo?: boolean;
  totalItems?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  baseUrl,
  showInfo = true,
  totalItems,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 px-4">
      {showInfo && (
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          {totalItems ? (
            <>
              顯示第 {(currentPage - 1) * 20 + 1} - {Math.min(currentPage * 20, totalItems)} 項，共 {totalItems} 項
            </>
          ) : (
            <>
              第 {currentPage} / {totalPages} 頁
            </>
          )}
        </div>
      )}

      <nav aria-label="分頁導航" className="flex items-center gap-1">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="上一頁"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-neutral-400 dark:text-neutral-600"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </span>
              );
            }

            const isActive = page === currentPage;
            const content = baseUrl ? (
              <Link
                href={`${baseUrl}?page=${page}`}
                className={`px-4 py-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                  isActive
                    ? "bg-primary-600 text-white font-medium"
                    : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600"
                }`}
                aria-label={`第 ${page} 頁`}
                aria-current={isActive ? "page" : undefined}
              >
                {page}
              </Link>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors ${
                  isActive
                    ? "bg-primary-600 text-white font-medium"
                    : "bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600"
                }`}
                aria-label={`第 ${page} 頁`}
                aria-current={isActive ? "page" : undefined}
              >
                {page}
              </motion.button>
            );

            return <div key={page}>{content}</div>;
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="下一頁"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </nav>
    </div>
  );
}


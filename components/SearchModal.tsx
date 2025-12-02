"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Wine, Building2, Sparkles, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HighlightText } from "@/lib/utils/search-highlight";
import EmptyState from "./EmptyState";
import { logger } from "@/lib/utils/logger-production";

interface SearchResult {
  id: string;
  type: "wine" | "winery";
  nameZh: string;
  nameEn: string;
  wineryName?: string;
  region?: string;
  price?: number;
  imageUrl?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularSearches] = useState([
    "Napa Valley",
    "Cabernet Sauvignon",
    "Chardonnay",
    "Bordeaux",
    "香檳",
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // 載入最近搜尋
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        logger.error(
          "Failed to load recent searches",
          e instanceof Error ? e : new Error(String(e)),
          { component: "SearchModal" }
        );
      }
    }
  }, []);

  // 當模態框打開時，聚焦輸入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // 即時搜尋（防抖）
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (response.ok) {
          setResults(data.results || []);
        } else {
          setResults([]);
        }
      } catch (error) {
        logger.error(
          "Search error",
          error instanceof Error ? error : new Error(String(error)),
          { component: "SearchModal", query }
        );
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 處理搜尋
  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    // 保存到最近搜尋
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
    
    // 導航到搜尋結果頁
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    onClose();
  };

  // 清除最近搜尋
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  // 處理鍵盤事件（P1 BATCH6：鍵盤導航優化）
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      handleSearch(query);
    } else if (e.key === "ArrowDown" && (results.length > 0 || recentSearches.length > 0)) {
      e.preventDefault();
      // 可以添加建議導航邏輯
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      // 可以添加建議導航邏輯
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start justify-center pt-32 px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden"
        >
          {/* 搜尋輸入框 - 優化移動端體驗 */}
          <div className="p-4 md:p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
              <label htmlFor="search-modal-input" className="sr-only">
                搜尋酒款、酒莊、產區
              </label>
              <input
                ref={inputRef}
                id="search-modal-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜尋酒款、酒莊、產區..."
                className="w-full pl-12 pr-20 py-3 md:py-4 text-base md:text-lg border-2 border-neutral-300 dark:border-neutral-600 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 min-h-[48px] md:min-h-[56px] placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                aria-label="搜尋酒款、酒莊、產區"
                aria-describedby="search-modal-description"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <span id="search-modal-description" className="sr-only">
                按Enter鍵搜尋，按Escape鍵關閉
              </span>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    aria-label="清除搜尋內容"
                  >
                    <X className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="關閉搜尋視窗"
                >
                  <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>
            </div>
          </div>

          {/* 搜尋結果 */}
          <div className="max-h-[500px] overflow-y-auto">
            {isLoading && (
              <div className="py-12 text-center">
                <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-sm text-neutral-500">搜尋中...</p>
              </div>
            )}

            {!isLoading && query && results.length > 0 && (
              <div className="py-4">
                <div className="px-6 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  搜尋結果 ({results.length})
                </div>
                <div className="space-y-1">
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      href={result.type === "wine" ? `/wines/${result.id}` : `/wineries/${result.id}`}
                      onClick={onClose}
                      className="block px-6 py-3 hover:bg-neutral-50 transition-colors group min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      aria-label={`前往${result.type === "wine" ? "酒款" : "酒莊"}：${result.nameZh}${result.nameEn ? ` (${result.nameEn})` : ""}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {result.type === "wine" ? (
                            <Wine className="w-6 h-6 text-primary-600" />
                          ) : (
                            <Building2 className="w-6 h-6 text-primary-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors truncate">
                              <HighlightText text={result.nameZh} query={query} />
                            </h4>
                            <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
                              {result.type === "wine" ? "酒款" : "酒莊"}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-500 truncate">
                            <HighlightText text={result.nameEn} query={query} />
                          </p>
                          {result.wineryName && (
                            <p className="text-xs text-neutral-400 mt-1">
                              <HighlightText text={result.wineryName} query={query} />
                            </p>
                          )}
                          {result.region && (
                            <p className="text-xs text-neutral-400 mt-1">
                              <HighlightText text={result.region} query={query} />
                            </p>
                          )}
                          {result.price && (
                            <p className="text-sm font-medium text-primary-600 mt-1">
                              NT$ {result.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && query && results.length === 0 && query.length > 0 && (
              <div className="py-12 px-6">
                <EmptyState
                  variant="search"
                  title="沒有找到相關結果"
                  description={`我們找不到與「${query}」相關的酒款或酒莊。`}
                />
                {/* 推薦建議 */}
                <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    建議嘗試：
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.slice(0, 5).map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className="px-3 py-1.5 text-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-600 dark:hover:text-primary-400 transition-colors min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                        aria-label={`搜尋 ${search}`}
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 最近搜尋 */}
            {!query && recentSearches.length > 0 && (
              <div className="py-4">
                <div className="flex items-center justify-between px-6 py-2">
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    最近搜尋
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors min-h-[44px] px-2 md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                    aria-label="清除最近搜尋記錄"
                  >
                    清除
                  </button>
                </div>
                <div className="px-6 space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="w-full text-left px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors flex items-center justify-between group min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      aria-label={`搜尋：${search}`}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
                        {search}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 熱門搜尋 */}
            {!query && (
              <div className="py-4 border-t border-neutral-100">
                <div className="px-6 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  熱門搜尋
                </div>
                <div className="px-6 flex flex-wrap gap-2">
                  {popularSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="px-4 py-2 text-sm text-neutral-700 bg-neutral-50 hover:bg-primary-50 hover:text-primary-600 rounded-full transition-colors border border-neutral-200 hover:border-primary-200 min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      aria-label={`熱門搜尋：${search}`}
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 提示 */}
            {!query && (
              <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
                <p className="text-xs text-neutral-500 text-center">
                  輸入關鍵字開始搜尋，或按 <kbd className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded text-[10px]">Enter</kbd> 執行搜尋
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


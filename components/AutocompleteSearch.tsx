"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/utils/logger-production";

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'wine' | 'winery' | 'region' | 'history' | 'trending';
  wineId?: string;
  slug?: string;
}

interface AutocompleteSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * 即時搜尋建議組件（P2）
 * 支持自動完成、搜尋歷史、模糊搜尋
 */
export default function AutocompleteSearch({
  onSearch,
  placeholder = "搜尋酒款、酒莊、產區...",
  className = "",
}: AutocompleteSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 載入搜尋歷史
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const history = localStorage.getItem("search_history");
        if (history) {
          setSearchHistory(JSON.parse(history));
        }
      } catch (error) {
        logger.error(
          "Failed to load search history",
          error instanceof Error ? error : new Error(String(error)),
          { component: "AutocompleteSearch" }
        );
      }
    }
  }, []);

  // 保存搜尋歷史
  const saveSearchHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    try {
      const updated = [
        searchQuery,
        ...searchHistory.filter((h) => h !== searchQuery),
      ].slice(0, 10); // 保留最近 10 條
      setSearchHistory(updated);
      localStorage.setItem("search_history", JSON.stringify(updated));
    } catch (error) {
      logger.error(
        "Failed to save search history",
        error instanceof Error ? error : new Error(String(error)),
        { component: "AutocompleteSearch", searchQuery }
      );
    }
  }, [searchHistory]);

  // 熱門搜尋（可從 API 獲取或使用靜態數據）
  const popularSearches: SearchSuggestion[] = [
    { id: 'popular-1', text: 'Napa Valley', type: 'trending' },
    { id: 'popular-2', text: 'Cabernet Sauvignon', type: 'trending' },
    { id: 'popular-3', text: 'Bordeaux', type: 'trending' },
    { id: 'popular-4', text: 'Chardonnay', type: 'trending' },
    { id: 'popular-5', text: '香檳', type: 'trending' },
  ];

  // 獲取搜尋建議
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      // 顯示搜尋歷史和熱門搜尋
      const historySuggestions: SearchSuggestion[] = searchHistory.slice(0, 5).map((h) => ({
        id: `history-${h}`,
        text: h,
        type: 'history',
      }));
      // 合併歷史和熱門搜尋
      const allSuggestions = [...historySuggestions, ...popularSearches.slice(0, 5 - historySuggestions.length)];
      setSuggestions(allSuggestions);
      return;
    }

    try {
      // 模糊搜尋 API
      const response = await fetch(`/api/wines/search?q=${encodeURIComponent(searchQuery)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        const apiSuggestions: SearchSuggestion[] = (data.suggestions || []).map((item: any) => ({
          id: item.id || `suggestion-${item.text}`,
          text: item.nameZh || item.nameEn || item.text,
          type: item.type || 'wine',
          wineId: item.id,
          slug: item.slug,
        }));

        // 合併搜尋歷史（如果匹配）
        const historyMatches = searchHistory
          .filter((h) => h.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 3)
          .map((h) => ({
            id: `history-${h}`,
            text: h,
            type: 'history' as const,
          }));

        setSuggestions([...historyMatches, ...apiSuggestions].slice(0, 8));
      }
    } catch (error) {
      logger.error(
        "Failed to fetch suggestions",
        error instanceof Error ? error : new Error(String(error)),
        { component: "AutocompleteSearch", searchQuery }
      );
      setSuggestions([]);
    }
  }, [searchHistory]);

  // 防抖搜尋
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        fetchSuggestions(query);
      } else {
        fetchSuggestions("");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  // 處理搜尋
  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    saveSearchHistory(searchQuery);
    onSearch(searchQuery);
    setShowSuggestions(false);
    setQuery("");
  }, [onSearch, saveSearchHistory]);

  // 處理鍵盤導航
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        const suggestion = suggestions[selectedIndex];
        if (suggestion.slug) {
          router.push(`/wines/${suggestion.slug}`);
        } else {
          handleSearch(suggestion.text);
        }
      } else if (query.trim()) {
        handleSearch(query);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // 清除搜尋歷史
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("search_history");
  };

  // 點擊外部關閉建議
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 搜尋輸入框 */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-12 pr-10 py-3
            bg-white dark:bg-neutral-800
            border border-neutral-300 dark:border-neutral-600
            rounded-lg
            text-neutral-900 dark:text-neutral-100
            placeholder:text-neutral-400
            focus:outline-none focus:ring-2 focus:ring-primary-500
            transition-all
          "
          aria-label="搜尋酒款"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="search-suggestions"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setShowSuggestions(false);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            aria-label="清除搜尋"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 搜尋建議下拉列表 */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            id="search-suggestions"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="
              absolute top-full left-0 right-0 mt-2
              bg-white dark:bg-neutral-800
              border border-neutral-200 dark:border-neutral-700
              rounded-lg shadow-xl
              max-h-96 overflow-y-auto
              z-50
            "
            role="listbox"
          >
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.id}
                onClick={() => {
                  if (suggestion.slug) {
                    router.push(`/wines/${suggestion.slug}`);
                  } else {
                    handleSearch(suggestion.text);
                  }
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full px-4 py-3 text-left
                  flex items-center gap-3
                  hover:bg-neutral-100 dark:hover:bg-neutral-700
                  transition-colors
                  focus:outline-none focus:bg-neutral-100 dark:focus:bg-neutral-700
                  ${selectedIndex === index ? 'bg-neutral-100 dark:bg-neutral-700' : ''}
                  min-h-[44px]
                `}
                role="option"
                aria-selected={selectedIndex === index}
              >
                {suggestion.type === 'history' ? (
                  <Clock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                ) : suggestion.type === 'trending' ? (
                  <TrendingUp className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                ) : (
                  <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                )}
                <span className="flex-1 text-neutral-900 dark:text-neutral-100">
                  {suggestion.text}
                </span>
                {suggestion.type === 'trending' && (
                  <span className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                    熱門
                  </span>
                )}
              </motion.button>
            ))}

            {/* 清除歷史按鈕 */}
            {query === "" && searchHistory.length > 0 && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 p-2">
                <button
                  onClick={clearHistory}
                  className="w-full text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 text-center py-2"
                >
                  清除搜尋歷史
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


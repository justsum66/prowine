"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, ChevronDown, SlidersHorizontal, ArrowUpDown, Grid, List, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { createButtonProps, createLinkProps } from "@/lib/utils/button-props";
import { createClickHandler, createChangeHandler } from "@/lib/utils/touch-handlers";
import AutocompleteSearch from "./AutocompleteSearch";
import { logger } from "@/lib/utils/logger-production";

interface FilterState {
  region: string[];
  priceRange: [number, number];
  vintage: number[];
  category: string[];
  minRating: number | null;
}

type SortOption = "default" | "price-asc" | "price-desc" | "rating-desc" | "vintage-desc" | "name-asc";

const SAVED_FILTERS_KEY = "prowine_saved_filters";

const PRICE_RANGES = [
  { label: "NT$ 0 - 3,000", min: 0, max: 3000 },
  { label: "NT$ 3,001 - 5,000", min: 3001, max: 5000 },
  { label: "NT$ 5,001 - 10,000", min: 5001, max: 10000 },
  { label: "NT$ 10,001 - 20,000", min: 10001, max: 20000 },
  { label: "NT$ 20,001+", min: 20001, max: 999999 },
];

const VINTAGE_RANGES = [
  { label: "2020-2024", min: 2020, max: 2024 },
  { label: "2015-2019", min: 2015, max: 2019 },
  { label: "2010-2014", min: 2010, max: 2014 },
  { label: "2000-2009", min: 2000, max: 2009 },
  { label: "1990-1999", min: 1990, max: 1999 },
];

const RATING_OPTIONS = [90, 92, 94, 96, 98];

export default function SearchAndFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterSectionsExpanded, setFilterSectionsExpanded] = useState<Record<string, boolean>>({
    region: true,
    price: true,
    vintage: true,
    category: true,
    rating: true,
  });
  const [resultCount, setResultCount] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get("sort") as SortOption) || "default");
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string; filters: FilterState }>>([]);
  const [filters, setFilters] = useState<FilterState>({
    region: [],
    priceRange: [0, 999999],
    vintage: [],
    category: [],
    minRating: null,
  });

  const regions = ["Napa Valley", "Bordeaux", "Burgundy", "Tuscany", "Rioja", "Barossa Valley"];
  const categories = [
    { value: "RED_WINE", label: "紅酒" },
    { value: "WHITE_WINE", label: "白酒" },
    { value: "CHAMPAGNE", label: "香檳" },
    { value: "SPARKLING_WINE", label: "氣泡酒" },
    { value: "ROSE_WINE", label: "粉紅酒" },
    { value: "NOBLE_ROT", label: "貴腐酒" },
  ];

  // 構建 URL 參數（提取重複邏輯）
  const buildSearchParams = useCallback((includePagination = false) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (filters.region.length > 0) params.set("region", filters.region[0]);
    if (filters.priceRange[0] > 0) params.set("minPrice", filters.priceRange[0].toString());
    if (filters.priceRange[1] < 999999) params.set("maxPrice", filters.priceRange[1].toString());
    if (filters.vintage.length === 2) {
      params.set("minVintage", filters.vintage[0].toString());
      params.set("maxVintage", filters.vintage[1].toString());
    }
    if (filters.category.length > 0) params.set("category", filters.category[0]);
    if (filters.minRating) params.set("minRating", filters.minRating.toString());
    if (sortBy && sortBy !== "default") params.set("sort", sortBy);
    if (includePagination) {
      params.set("limit", "1");
      params.set("page", "1");
    }
    return params;
  }, [searchQuery, filters, sortBy]);

  // 從 URL 載入篩選條件（防止循環更新）
  useEffect(() => {
    const region = searchParams.get("region");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minVintage = searchParams.get("minVintage");
    const maxVintage = searchParams.get("maxVintage");
    const minRating = searchParams.get("minRating");
    const category = searchParams.get("category");
    const search = searchParams.get("search") || "";
    const sort = (searchParams.get("sort") as SortOption) || "default";

    // 只有當 URL 參數真正改變時才更新 state（避免循環）
    const newFilters: FilterState = {
      region: region ? [region] : [],
      priceRange: [
        minPrice ? parseInt(minPrice) : 0,
        maxPrice ? parseInt(maxPrice) : 999999,
      ] as [number, number],
      vintage: minVintage && maxVintage ? [parseInt(minVintage), parseInt(maxVintage)] : [],
      category: category ? [category] : [],
      minRating: minRating ? parseInt(minRating) : null,
    };

    // 檢查是否有變化
    const hasChanged = 
      JSON.stringify(newFilters.region) !== JSON.stringify(filters.region) ||
      JSON.stringify(newFilters.priceRange) !== JSON.stringify(filters.priceRange) ||
      JSON.stringify(newFilters.vintage) !== JSON.stringify(filters.vintage) ||
      JSON.stringify(newFilters.category) !== JSON.stringify(filters.category) ||
      newFilters.minRating !== filters.minRating;

    if (hasChanged) {
      setFilters(newFilters);
    }

    if (search !== searchQuery) {
      setSearchQuery(search);
    }

    // 更新排序選項
    if (sort !== sortBy) {
      setSortBy(sort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 載入保存的過濾器組合
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(SAVED_FILTERS_KEY);
        if (saved) {
          setSavedFilters(JSON.parse(saved));
        }
      } catch (error) {
        logger.error(
          "Failed to load saved filters",
          error instanceof Error ? error : new Error(String(error)),
          { component: "SearchAndFilter" }
        );
      }
    }
  }, []);

  // 更新 URL 參數（使用 replace 避免歷史記錄堆積）
  const updateURL = useCallback(() => {
    const params = buildSearchParams(false);
    // 使用 replace 而不是 push，避免歷史記錄堆積（手機版特別重要）
    router.replace(`/wines?${params.toString()}`, { scroll: false });
  }, [buildSearchParams, router]);

  // 搜尋防抖（避免頻繁更新 URL）
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    // 如果與 URL 中的值相同，不更新（避免循環）
    if (searchQuery === currentSearch) {
      return;
    }

    const timer = setTimeout(() => {
      updateURL();
    }, 600); // 增加防抖時間，減少更新頻率
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // 篩選條件改變時更新 URL（添加防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL();
    }, 400); // 增加防抖時間，減少更新頻率
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy]);

  // 獲取篩選結果計數（添加防抖和請求鎖，避免重複請求）
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchResultCount = async () => {
        try {
          const params = buildSearchParams(true);
          const response = await fetch(`/api/wines?${params.toString()}`);
          if (response.ok) {
            const data = await response.json();
            setResultCount(data.total || 0);
          }
        } catch (error) {
          logger.error(
            "Failed to fetch result count",
            error instanceof Error ? error : new Error(String(error)),
            { component: "SearchAndFilter", searchQuery, filters }
          );
        }
      };

      fetchResultCount();
    }, 800); // 800ms 防抖，等待 URL 更新完成
    
    return () => clearTimeout(timer);
  }, [buildSearchParams]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSortBy("default");
    setFilters({
      region: [],
      priceRange: [0, 999999],
      vintage: [],
      category: [],
      minRating: null,
    });
    router.push("/wines");
  };

  // 保存當前過濾器組合
  const saveCurrentFilters = () => {
    const name = prompt("請為此過濾器組合命名：");
    if (!name || name.trim() === "") return;

    const newSavedFilter = {
      name: name.trim(),
      filters: { ...filters },
    };

    const updated = [...savedFilters, newSavedFilter];
    setSavedFilters(updated);

    try {
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated));
    } catch (error) {
      logger.error(
        "Failed to save filters",
        error instanceof Error ? error : new Error(String(error)),
        { component: "SearchAndFilter" }
      );
    }
  };

  // 載入保存的過濾器組合
  const loadSavedFilter = (savedFilter: { name: string; filters: FilterState }) => {
    setFilters(savedFilter.filters);
    setIsFilterOpen(false);
  };

  // 刪除保存的過濾器組合
  const deleteSavedFilter = (index: number) => {
    const updated = savedFilters.filter((_, i) => i !== index);
    setSavedFilters(updated);

    try {
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated));
    } catch (error) {
      logger.error(
        "Failed to delete saved filter",
        error instanceof Error ? error : new Error(String(error)),
        { component: "SearchAndFilter" }
      );
    }
  };

  const hasActiveFilters =
    filters.region.length > 0 ||
    filters.priceRange[0] > 0 ||
    filters.priceRange[1] < 999999 ||
    filters.vintage.length > 0 ||
    filters.category.length > 0 ||
    filters.minRating !== null;

  return (
    <div className="bg-white border-b border-neutral-200 sticky top-20 z-40" style={{ touchAction: "manipulation" }}>
      <div className="container-custom py-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜尋框（P2：使用 AutocompleteSearch） */}
          <div className="flex-1">
            <AutocompleteSearch
              onSearch={(query) => {
                setSearchQuery(query);
                // 更新 URL 會由 useEffect 處理
              }}
              placeholder="搜尋酒款、酒莊、產區..."
            />
          </div>

          {/* 排序選項 */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="sr-only">
              排序方式
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
              }}
              className="px-4 py-3 border border-neutral-300 rounded-lg bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[44px] md:min-h-[auto] dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
              aria-label="選擇排序方式"
            >
              <option value="default">預設排序</option>
              <option value="price-asc">價格：低到高</option>
              <option value="price-desc">價格：高到低</option>
              <option value="rating-desc">評分：高到低</option>
              <option value="vintage-desc">年份：新到舊</option>
              <option value="name-asc">名稱：A-Z</option>
            </select>
          </div>

          {/* 篩選按鈕 */}
          <button
            {...createButtonProps(
              () => setIsFilterOpen(!isFilterOpen),
              {
                className: `px-4 md:px-6 py-3 border rounded-lg transition-colors flex items-center gap-2 font-medium md:min-h-[auto] ${
                  hasActiveFilters
                    ? "border-primary-600 bg-primary-50 text-primary-600"
                    : "border-neutral-300 hover:bg-neutral-50"
                }`,
                "aria-label": "開啟高級篩選",
                preventDefault: true,
              }
            )}
            aria-expanded={isFilterOpen}
          >
            <SlidersHorizontal className="w-5 h-5" />
            高級篩選
            {resultCount !== null && (
              <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded-full">
                {resultCount}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isFilterOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* 清除所有篩選 */}
          {hasActiveFilters && (
            <button
              {...createButtonProps(
                () => clearAllFilters(),
                {
                  className: "px-4 md:px-6 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium md:min-h-[auto]",
                  "aria-label": "清除所有篩選條件",
                  preventDefault: true,
                }
              )}
            >
              清除所有
            </button>
          )}
        </div>

        {/* 高級篩選面板 */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              transition={{ 
                duration: 0.3, 
                ease: [0.4, 0, 0.2, 1],
                opacity: { duration: 0.2 }
              }}
              className="overflow-hidden"
              onAnimationComplete={() => {
                // 動畫完成後，如果面板打開，記住狀態
                if (isFilterOpen && typeof window !== "undefined") {
                  localStorage.setItem("prowine_filter_panel_open", "true");
                }
              }}
            >
              <div className="pt-6 pb-4 border-t border-neutral-200 mt-4">
                {/* 保存的過濾器組合 */}
                {savedFilters.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-neutral-200">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        已保存的過濾器
                      </label>
                      <button
                        {...createButtonProps(
                          saveCurrentFilters,
                          {
                            className: "text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 min-h-[44px] md:min-h-[auto]",
                            preventDefault: true,
                          }
                        )}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        保存當前組合
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {savedFilters.map((saved, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                        >
                          <button
                            {...createButtonProps(
                              () => loadSavedFilter(saved),
                              {
                                className: "text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 min-h-[44px] md:min-h-[auto]",
                                preventDefault: true,
                              }
                            )}
                          >
                            <BookmarkCheck className="w-4 h-4" />
                            {saved.name}
                          </button>
                          <button
                            {...createButtonProps(
                              () => deleteSavedFilter(index),
                              {
                                className: "p-1 text-neutral-400 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] flex items-center justify-center",
                                preventDefault: true,
                              }
                            )}
                            aria-label={`刪除過濾器組合：${saved.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 保存當前過濾器按鈕（如果沒有保存的過濾器） */}
                {savedFilters.length === 0 && hasActiveFilters && (
                  <div className="mb-6 pb-6 border-b border-neutral-200">
                    <button
                      {...createButtonProps(
                        saveCurrentFilters,
                        {
                          className: "text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-2 min-h-[44px] md:min-h-[auto]",
                          preventDefault: true,
                        }
                      )}
                    >
                      <Bookmark className="w-4 h-4" />
                      保存當前過濾器組合
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* 產區篩選 */}
                  <div>
                    <button
                      onClick={() => setFilterSectionsExpanded({ ...filterSectionsExpanded, region: !filterSectionsExpanded.region })}
                      className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors min-h-[44px] md:min-h-[auto]"
                    >
                      <span>產區</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${filterSectionsExpanded.region ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {filterSectionsExpanded.region && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                      {regions.map((region) => (
                        <label
                          key={region}
                          className="flex items-center gap-2 cursor-pointer hover:text-primary-600 transition-colors touch-manipulation min-h-[44px]"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          <input
                            type="radio"
                            name="region"
                            checked={filters.region.includes(region)}
                            onChange={createChangeHandler((e) => {
                              if (e.currentTarget.checked) {
                                setFilters({ ...filters, region: [region] });
                              } else {
                                setFilters({ ...filters, region: [] });
                              }
                            })}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 touch-manipulation"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                          />
                          <span className="text-sm">{region}</span>
                        </label>
                      ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 價格範圍 */}
                  <div>
                    <button
                      onClick={() => setFilterSectionsExpanded({ ...filterSectionsExpanded, price: !filterSectionsExpanded.price })}
                      className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors min-h-[44px] md:min-h-[auto]"
                    >
                      <span>價格範圍</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${filterSectionsExpanded.price ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {filterSectionsExpanded.price && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2">
                      {PRICE_RANGES.map((range, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-2 cursor-pointer hover:text-primary-600 transition-colors touch-manipulation min-h-[44px]"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          <input
                            type="radio"
                            name="priceRange"
                            checked={
                              filters.priceRange[0] === range.min &&
                              filters.priceRange[1] === range.max
                            }
                            onChange={createChangeHandler(() => {
                              setFilters({
                                ...filters,
                                priceRange: [range.min, range.max],
                              });
                            })}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 touch-manipulation"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                          />
                          <span className="text-sm">{range.label}</span>
                        </label>
                      ))}
                      <div className="flex items-center gap-2 pt-2 border-t border-neutral-200">
                        <input
                          type="number"
                          value={filters.priceRange[0] || ""}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              priceRange: [
                                parseInt(e.target.value) || 0,
                                filters.priceRange[1],
                              ],
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] md:min-h-[auto]"
                          placeholder="最低"
                          aria-label="最低價格"
                          inputMode="numeric"
                        />
                        <span className="text-neutral-500" aria-hidden="true">-</span>
                        <input
                          type="number"
                          value={filters.priceRange[1] === 999999 ? "" : filters.priceRange[1]}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              priceRange: [
                                filters.priceRange[0],
                                parseInt(e.target.value) || 999999,
                              ],
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] md:min-h-[auto]"
                          placeholder="最高"
                          aria-label="最高價格"
                          inputMode="numeric"
                        />
                      </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 年份範圍 */}
                  <div>
                    <button
                      onClick={() => setFilterSectionsExpanded({ ...filterSectionsExpanded, vintage: !filterSectionsExpanded.vintage })}
                      className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors min-h-[44px] md:min-h-[auto]"
                    >
                      <span>年份</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${filterSectionsExpanded.vintage ? "rotate-180" : ""}`}
                      />
                    </button>
                    <AnimatePresence>
                      {filterSectionsExpanded.vintage && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-2">
                      {VINTAGE_RANGES.map((range, index) => (
                        <label
                          key={index}
                          className="flex items-center gap-2 cursor-pointer hover:text-primary-600 transition-colors touch-manipulation min-h-[44px]"
                          style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                          <input
                            type="radio"
                            name="vintage"
                            checked={
                              filters.vintage.length === 2 &&
                              filters.vintage[0] === range.min &&
                              filters.vintage[1] === range.max
                            }
                            onChange={createChangeHandler(() => {
                              setFilters({
                                ...filters,
                                vintage: [range.min, range.max],
                              });
                            })}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 touch-manipulation"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                          />
                          <span className="text-sm">{range.label}</span>
                        </label>
                      ))}
                      <div className="flex items-center gap-2 pt-2 border-t border-neutral-200">
                        <input
                          type="number"
                          value={filters.vintage[0] || ""}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              vintage: [
                                parseInt(e.target.value) || 0,
                                filters.vintage[1] || 2024,
                              ],
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="最低年份"
                        />
                        <span className="text-neutral-500">-</span>
                        <input
                          type="number"
                          value={filters.vintage[1] || ""}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              vintage: [
                                filters.vintage[0] || 0,
                                parseInt(e.target.value) || 2024,
                              ],
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="最高年份"
                        />
                      </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 評分與分類 */}
                  <div className="space-y-6">
                    {/* 評分篩選 */}
                    <div>
                      <button
                        onClick={() => setFilterSectionsExpanded({ ...filterSectionsExpanded, rating: !filterSectionsExpanded.rating })}
                        className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors min-h-[44px] md:min-h-[auto]"
                      >
                        <span>最低評分</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${filterSectionsExpanded.rating ? "rotate-180" : ""}`}
                        />
                      </button>
                      <AnimatePresence>
                        {filterSectionsExpanded.rating && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2">
                        {RATING_OPTIONS.map((rating) => (
                          <label
                            key={rating}
                            className="flex items-center gap-2 cursor-pointer hover:text-primary-600 transition-colors touch-manipulation min-h-[44px]"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                          >
                            <input
                              type="radio"
                              name="rating"
                              checked={filters.minRating === rating}
                              onChange={createChangeHandler(() => {
                                setFilters({
                                  ...filters,
                                  minRating: rating,
                                });
                              })}
                              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 touch-manipulation"
                              style={{ WebkitTapHighlightColor: "transparent" }}
                            />
                            <span className="text-sm">{rating}+ 分</span>
                          </label>
                        ))}
                        <button
                          {...createButtonProps(
                            () => setFilters({ ...filters, minRating: null }),
                            {
                              className: "text-xs text-neutral-500 hover:text-primary-600",
                              preventDefault: true,
                            }
                          )}
                        >
                          清除評分篩選
                        </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* 酒款類型 */}
                    <div>
                      <button
                        onClick={() => setFilterSectionsExpanded({ ...filterSectionsExpanded, category: !filterSectionsExpanded.category })}
                        className="flex items-center justify-between w-full mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors min-h-[44px] md:min-h-[auto]"
                      >
                        <span>酒款類型</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${filterSectionsExpanded.category ? "rotate-180" : ""}`}
                        />
                      </button>
                      <AnimatePresence>
                        {filterSectionsExpanded.category && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-2">
                        {categories.map((cat) => (
                          <label
                            key={cat.value}
                            className="flex items-center gap-2 cursor-pointer hover:text-primary-600 transition-colors touch-manipulation min-h-[44px]"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                          >
                            <input
                              type="radio"
                              name="category"
                              checked={filters.category.includes(cat.value)}
                              onChange={createChangeHandler((e) => {
                                if (e.currentTarget.checked) {
                                  setFilters({ ...filters, category: [cat.value] });
                                } else {
                                  setFilters({ ...filters, category: [] });
                                }
                              })}
                              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 touch-manipulation"
                              style={{ WebkitTapHighlightColor: "transparent" }}
                            />
                            <span className="text-sm">{cat.label}</span>
                          </label>
                        ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

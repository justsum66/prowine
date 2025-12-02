"use client";

import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useToast } from "@/components/admin/Toast";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";
import AdvancedSearch from "@/components/admin/AdvancedSearch";
import type { SearchCondition } from "@/components/admin/AdvancedSearch";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  MoreVertical,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Star,
  Package,
  AlertCircle,
} from "lucide-react";

interface Wine {
  id: string;
  slug: string;
  nameZh: string;
  nameEn: string;
  category: string;
  price: number;
  stock: number;
  stockAlert: number;
  published: boolean;
  featured: boolean;
  bestseller: boolean;
  mainImageUrl?: string;
  wineryId?: string;
  wineries?: {
    id: string;
    nameZh: string;
    nameEn: string;
  };
  createdAt: string;
}

export default function AdminWinesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [wines, setWines] = useState<Wine[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPublished, setFilterPublished] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchWines();
  }, [pagination.page, filterPublished, searchTerm]);

  const fetchWines = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterPublished !== "all" && { published: filterPublished }),
      });

      const response = await fetch(`/api/admin/wines?${params}`);
      if (response.ok) {
        const data = await response.json();
        setWines(data.wines || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch wines", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/wines/export?format=csv");
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `wines-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("success", "匯出成功");
      } else {
        showToast("error", "匯出失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Export error", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "匯出失敗");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      showToast("error", "請選擇CSV文件");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/wines/import", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        showToast(
          "success",
          `匯入完成：成功 ${result.success} 筆，失敗 ${result.failed} 筆`
        );
        if (result.errors && result.errors.length > 0) {
          // Q22優化：使用logger替代console.error
          logger.error("Import errors", new Error("Import validation errors"), { errors: result.errors });
        }
        fetchWines();
      } else {
        const error = await response.json();
        showToast("error", error.error || "匯入失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Import error", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "匯入失敗");
    } finally {
      // 重置input
      e.target.value = "";
    }
  };

  // Q21優化：定義類型接口，消除any
  const handleBatchAction = async (action: string, data?: Record<string, unknown>) => {
    if (selectedIds.size === 0) {
      showToast("warning", "請至少選擇一個酒款");
      return;
    }

    try {
      const response = await fetch("/api/admin/wines/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          wineIds: Array.from(selectedIds),
          data,
        }),
      });

      if (response.ok) {
        setSelectedIds(new Set());
        fetchWines();
        showToast("success", "操作成功");
      } else {
        showToast("error", "操作失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Batch action error", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "操作失敗");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此酒款嗎？")) return;

    try {
      const response = await fetch(`/api/admin/wines/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchWines();
        showToast("success", "刪除成功");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Delete error", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "刪除失敗");
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === wines.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(wines.map((w) => w.id)));
    }
  };

  const categoryLabels: Record<string, string> = {
    SPARKLING_WINE: "氣泡酒",
    WHITE_WINE: "白酒",
    ROSE_WINE: "粉紅酒",
    RED_WINE: "紅酒",
    NOBLE_ROT: "貴腐酒",
    CHAMPAGNE: "香檳",
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            酒款管理
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            管理所有酒款資料
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/wines/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            新增酒款
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="搜尋酒款名稱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={filterPublished}
              onChange={(e) => setFilterPublished(e.target.value)}
              className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            >
              <option value="all">全部狀態</option>
              <option value="true">已發布</option>
              <option value="false">未發布</option>
            </select>
            <AdvancedSearch
              fields={[
                { label: "中文名稱", value: "nameZh", type: "text" },
                { label: "英文名稱", value: "nameEn", type: "text" },
                { label: "分類", value: "category", type: "select", options: ["RED_WINE", "WHITE_WINE", "ROSE_WINE", "SPARKLING_WINE", "CHAMPAGNE", "NOBLE_ROT"] },
                { label: "價格", value: "price", type: "number" },
                { label: "庫存", value: "stock", type: "number" },
                { label: "已發布", value: "published", type: "select", options: ["true", "false"] },
                { label: "推薦", value: "featured", type: "select", options: ["true", "false"] },
              ]}
              onSearch={(conditions) => {
                // 將高級搜索條件轉換為API參數
                const params = new URLSearchParams({
                  page: "1",
                  limit: pagination.limit.toString(),
                });
                
                conditions.forEach((cond) => {
                  if (cond.operator === "contains") {
                    params.append("search", cond.value);
                  } else {
                    params.append(`filter[${cond.field}][${cond.operator}]`, cond.value);
                  }
                });
                
                // 重新獲取數據
                fetchWines();
              }}
            />
          </div>

          {/* Export/Import Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-600 flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              匯出 CSV
            </button>
            <label className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-600 flex items-center gap-2 text-sm cursor-pointer">
              <Upload className="w-4 h-4" />
              匯入 CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          {/* Batch Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                已選擇 {selectedIds.size} 項
              </span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBatchAction(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
              >
                <option value="">批量操作</option>
                <option value="publish">批量發布</option>
                <option value="unpublish">批量取消發布</option>
                <option value="feature">批量設為推薦</option>
                <option value="unfeature">批量取消推薦</option>
                <option value="delete">批量刪除</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Wine List */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {isLoading ? (
          <AdminTableSkeleton />
        ) : wines.length === 0 ? (
          <div className="text-center p-12 text-neutral-500 dark:text-neutral-400">
            沒有找到酒款
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={toggleSelectAll}
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      >
                        {selectedIds.size === wines.length ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      圖片
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      名稱
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      分類
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      價格
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      庫存
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      狀態
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {wines.map((wine) => (
                    <tr
                      key={wine.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelect(wine.id)}
                          className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                        >
                          {selectedIds.has(wine.id) ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {wine.mainImageUrl ? (
                          <img
                            src={wine.mainImageUrl}
                            alt={wine.nameZh}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-neutral-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {wine.nameZh}
                          </div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {wine.nameEn}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded text-sm text-neutral-700 dark:text-neutral-300">
                          {categoryLabels[wine.category] || wine.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">
                        NT$ {wine.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              wine.stock < wine.stockAlert
                                ? "text-red-600 dark:text-red-400 font-medium"
                                : "text-neutral-900 dark:text-neutral-100"
                            }
                          >
                            {wine.stock}
                          </span>
                          {wine.stock < wine.stockAlert && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {wine.published ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                              已發布
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-xs">
                              未發布
                            </span>
                          )}
                          {wine.featured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/wines/${wine.id}/edit`}
                            className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                            title="編輯"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(wine.id)}
                            className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="刪除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  共 {pagination.total} 筆，第 {pagination.page} / {pagination.totalPages} 頁
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    上一頁
                  </button>
                  <button
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.min(prev.totalPages, prev.page + 1),
                      }))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-700"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, CheckSquare, Square, Building2, Package } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface Winery {
  id: string;
  nameZh: string;
  nameEn: string;
  slug: string;
  region?: string;
  country?: string;
  logoUrl?: string;
  featured: boolean;
  wineCount?: number;
  createdAt: string;
}

export default function AdminWineriesPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [wineries, setWineries] = useState<Winery[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchWineries();
  }, [pagination.page, searchTerm]);

  const fetchWineries = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/wineries?${params}`);
      if (response.ok) {
        const data = await response.json();
        setWineries(data.wineries || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch wineries", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此酒莊嗎？")) return;

    try {
      const response = await fetch(`/api/admin/wineries/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchWineries();
        showToast("success", "刪除成功");
      } else {
        const error = await response.json();
        showToast("error", error.error || "刪除失敗");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            酒莊管理
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            管理所有酒莊資料
          </p>
        </div>
        <Link
          href="/admin/wineries/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          新增酒莊
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="搜尋酒莊名稱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>
      </div>

      {/* Winery List */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {isLoading ? (
          <AdminTableSkeleton />
        ) : wineries.length === 0 ? (
          <div className="text-center p-12 text-neutral-500 dark:text-neutral-400">
            沒有找到酒莊
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      圖片
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      名稱
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      產區
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      酒款數
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
                  {wineries.map((winery) => (
                    <tr
                      key={winery.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {winery.logoUrl ? (
                          <img
                            src={winery.logoUrl}
                            alt={winery.nameZh}
                            className="w-12 h-12 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-neutral-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {winery.nameZh}
                          </div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {winery.nameEn}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">
                        {winery.region || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-neutral-400" />
                          <span className="text-neutral-900 dark:text-neutral-100">
                            {winery.wineCount || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {winery.featured && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs">
                            推薦
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/wineries/${winery.id}/edit`}
                            className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(winery.id)}
                            className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
                    className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded disabled:opacity-50"
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
                    className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded disabled:opacity-50"
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


"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, FileText, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface Article {
  id: string;
  titleZh: string;
  titleEn: string;
  slug: string;
  category: string;
  published: boolean;
  featured: boolean;
  views: number;
  createdAt: string;
  wineries?: {
    id: string;
    nameZh: string;
    nameEn: string;
  };
}

export default function AdminArticlesPage() {
  const { showToast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchArticles();
  }, [pagination.page, searchTerm]);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/articles?${params}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch articles", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此文章嗎？")) return;

    try {
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchArticles();
        showToast("success", "刪除成功");
      } else {
        showToast("error", "刪除失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Delete error", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "刪除失敗");
    }
  };

  const categoryLabels: Record<string, string> = {
    WINE_KNOWLEDGE: "品酒知識",
    WINERY_STORY: "酒莊故事",
    PAIRING_TIPS: "搭配建議",
    HEALTH_BENEFITS: "健康益處",
    TASTING_TIPS: "品酒技巧",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            文章管理
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            管理所有文章內容
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          新增文章
        </Link>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="搜尋文章標題..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            />
          </div>
        </div>
      </div>

      {/* Article List */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {isLoading ? (
          <AdminTableSkeleton />
        ) : articles.length === 0 ? (
          <div className="text-center p-12 text-neutral-500 dark:text-neutral-400">
            沒有找到文章
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      標題
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      分類
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      瀏覽量
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      狀態
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      建立時間
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {articles.map((article) => (
                    <tr
                      key={article.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">
                            {article.titleZh}
                          </div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            {article.titleEn}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded text-sm">
                          {categoryLabels[article.category] || article.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">
                        {article.views}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {article.published ? (
                            <>
                              <Eye className="w-4 h-4 text-green-500" />
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs">
                                已發布
                              </span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4 text-neutral-400" />
                              <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded text-xs">
                                未發布
                              </span>
                            </>
                          )}
                          {article.featured && (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs">
                              推薦
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                        {new Date(article.createdAt).toLocaleDateString("zh-TW")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/articles/${article.id}/edit`}
                            className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(article.id)}
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
                    className="px-3 py-1 border rounded disabled:opacity-50"
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
                    className="px-3 py-1 border rounded disabled:opacity-50"
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


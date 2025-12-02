"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Calendar,
  User,
  Loader2,
  FileText,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface AuditLogItem {
  id: string;
  adminId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  admins: {
    id: string;
    email: string;
    name: string;
  } | null;
}

export default function AdminAuditLogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEntity, setFilterEntity] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filterEntity, searchTerm]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterEntity !== "all" && { entity: filterEntity }),
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      } else {
        const error = await response.json();
        showToast("error", error.error || "載入審計日誌失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch audit logs", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "載入審計日誌失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE")) {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    } else if (action.includes("UPDATE")) {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    } else if (action.includes("DELETE")) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    } else if (action.includes("BATCH")) {
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
    }
    return "bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300";
  };

  const entityTypes = ["WINE", "WINERY", "ARTICLE", "USER", "INQUIRY"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">審計日誌</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            查看所有管理員操作記錄
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋操作類型或實體類型..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            >
              <option value="all">全部實體</option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <AdminTableSkeleton />
      ) : logs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            {searchTerm || filterEntity !== "all"
              ? "找不到符合條件的日誌"
              : "尚未有審計日誌"}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      管理員
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      操作
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      實體
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      實體ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {logs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-neutral-400 mr-2" />
                          <span className="text-sm text-neutral-900 dark:text-neutral-100">
                            {log.admins?.name || log.admins?.email || "系統"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getActionBadge(log.action)}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                        {log.entity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                        {log.entityId ? log.entityId.substring(0, 8) + "..." : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          詳情
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一頁
              </button>
              <span className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                第 {pagination.page} / {pagination.totalPages} 頁（共 {pagination.total} 條日誌）
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(pagination.totalPages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一頁
              </button>
            </div>
          )}
        </>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  審計日誌詳情
                </h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  <Eye className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">操作時間</label>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                      {formatDate(selectedLog.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">管理員</label>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                      {selectedLog.admins?.name || selectedLog.admins?.email || "系統"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">操作類型</label>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                      {selectedLog.action}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">實體類型</label>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                      {selectedLog.entity}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">實體ID</label>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium font-mono text-xs">
                      {selectedLog.entityId || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">IP地址</label>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium font-mono text-xs">
                      {selectedLog.ipAddress || "-"}
                    </p>
                  </div>
                </div>

                {selectedLog.changes && (
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">變更內容</label>
                    <div className="mt-2 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                      <pre className="text-sm text-neutral-900 dark:text-neutral-100 overflow-auto">
                        {JSON.stringify(selectedLog.changes, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedLog.userAgent && (
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">User Agent</label>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium text-xs break-all">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  User,
  Mail,
  Phone,
  Calendar,
  Star,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Edit,
  Save,
} from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  membershipLevel: "REGULAR" | "VIP" | "PREMIUM";
  points: number;
  emailVerified: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserEditData {
  name: string | null;
  phone: string | null;
  membershipLevel: "REGULAR" | "VIP" | "PREMIUM";
  points: number;
  active: boolean;
  emailVerified: boolean;
}

export default function AdminUsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<UserEditData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filterActive, filterLevel, searchTerm]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterActive !== "all" && { active: filterActive }),
        ...(filterLevel !== "all" && { membershipLevel: filterLevel }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch users", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const getMembershipLevelBadge = (level: string) => {
    const styles = {
      REGULAR: "bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300",
      VIP: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      PREMIUM: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    const labels = {
      REGULAR: "一般會員",
      VIP: "VIP 會員",
      PREMIUM: "尊榮會員",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[level as keyof typeof styles]}`}>
        {labels[level as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEdit = () => {
    if (selectedUser) {
      setIsEditing(true);
      setEditFormData({
        name: selectedUser.name || "",
        phone: selectedUser.phone || "",
        membershipLevel: selectedUser.membershipLevel,
        points: selectedUser.points,
        active: selectedUser.active,
        emailVerified: selectedUser.emailVerified,
      });
    }
  };

  const handleSave = async () => {
    if (!selectedUser || !editFormData) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data.user);
        setIsEditing(false);
        fetchUsers();
        showToast("success", "會員資料更新成功！");
      } else {
        const error = await response.json();
        showToast("error", error.error || "更新失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Update error", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "更新失敗");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditFormData(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">會員管理</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            管理所有註冊會員的基本資訊與狀態
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋會員 Email 或姓名..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 min-h-[44px]"
            aria-label="搜尋會員 Email 或姓名"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 min-h-[44px]"
              aria-label="篩選會員狀態"
            >
              <option value="all">全部狀態</option>
              <option value="true">活躍</option>
              <option value="false">停用</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-neutral-500" />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 min-h-[44px]"
              aria-label="篩選會員等級"
            >
              <option value="all">全部等級</option>
              <option value="REGULAR">一般會員</option>
              <option value="VIP">VIP 會員</option>
              <option value="PREMIUM">尊榮會員</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <AdminTableSkeleton />
      ) : users.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <User className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            {searchTerm || filterActive !== "all" || filterLevel !== "all"
              ? "找不到符合條件的會員"
              : "尚未有會員註冊"}
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
                      會員資訊
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      等級
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      積分
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      註冊時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {users.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {user.name || "未設定"}
                            </div>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getMembershipLevelBadge(user.membershipLevel)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                        {user.points.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {user.active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <CheckCircle className="w-3 h-3" />
                              活躍
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              <XCircle className="w-3 h-3" />
                              停用
                            </span>
                          )}
                          {user.emailVerified && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              <CheckCircle className="w-3 h-3" />
                              已驗證
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                          aria-label={`查看 ${user.name || user.email} 的詳情`}
                        >
                          <Eye className="w-4 h-4" aria-hidden="true" />
                          查看詳情
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
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="上一頁"
              >
                上一頁
              </button>
              <span className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                第 {pagination.page} / {pagination.totalPages} 頁（共 {pagination.total} 位會員）
              </span>
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(pagination.totalPages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="下一頁"
              >
                下一頁
              </button>
            </div>
          )}
        </>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="user-detail-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 id="user-detail-title" className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  會員詳情
                </h2>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      aria-label="編輯會員資料"
                    >
                      <Edit className="w-4 h-4" aria-hidden="true" />
                      編輯
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setIsEditing(false);
                      setEditFormData(null);
                    }}
                    className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                    aria-label="關閉會員詳情"
                  >
                    <XCircle className="w-6 h-6" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">Email</label>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                      {selectedUser.email}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">Email 不可修改</p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">姓名</label>
                    {isEditing && editFormData ? (
                      <input
                        type="text"
                        value={editFormData.name || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value || null })}
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                        aria-label="姓名"
                      />
                    ) : (
                      <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                        {selectedUser.name || "未設定"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">電話</label>
                    {isEditing && editFormData ? (
                      <input
                        type="text"
                        value={editFormData.phone || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value || null })}
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                        aria-label="電話"
                      />
                    ) : (
                      <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                        {selectedUser.phone || "未設定"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">會員等級</label>
                    {isEditing && editFormData ? (
                      <select
                        value={editFormData.membershipLevel}
                        onChange={(e) => {
                          const value = e.target.value as "REGULAR" | "VIP" | "PREMIUM";
                          setEditFormData({ ...editFormData, membershipLevel: value });
                        }}
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                        aria-label="會員等級"
                      >
                        <option value="REGULAR">一般會員</option>
                        <option value="VIP">VIP 會員</option>
                        <option value="PREMIUM">尊榮會員</option>
                      </select>
                    ) : (
                      <div className="mt-1">{getMembershipLevelBadge(selectedUser.membershipLevel)}</div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">積分</label>
                    {isEditing && editFormData ? (
                      <input
                        type="number"
                        min="0"
                        value={editFormData.points}
                        onChange={(e) => setEditFormData({ ...editFormData, points: parseInt(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                      />
                    ) : (
                      <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                        {selectedUser.points.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">狀態</label>
                    {isEditing && editFormData ? (
                      <label className="flex items-center gap-3 mt-2">
                        <input
                          type="checkbox"
                          checked={editFormData.active}
                          onChange={(e) => setEditFormData({ ...editFormData, active: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <span className="text-sm text-neutral-900 dark:text-neutral-100">
                          {editFormData.active ? "活躍" : "停用"}
                        </span>
                      </label>
                    ) : (
                      <div className="mt-1">
                        {selectedUser.active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            活躍
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            <XCircle className="w-3 h-3" />
                            停用
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">Email 驗證</label>
                    {isEditing && editFormData ? (
                      <label className="flex items-center gap-3 mt-2">
                        <input
                          type="checkbox"
                          checked={editFormData.emailVerified}
                          onChange={(e) => setEditFormData({ ...editFormData, emailVerified: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <span className="text-sm text-neutral-900 dark:text-neutral-100">
                          {editFormData.emailVerified ? "已驗證" : "未驗證"}
                        </span>
                      </label>
                    ) : (
                      <div className="mt-1">
                        {selectedUser.emailVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                            <CheckCircle className="w-3 h-3" />
                            已驗證
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                            <XCircle className="w-3 h-3" />
                            未驗證
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">註冊時間</label>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-500 dark:text-neutral-400">最後更新</label>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                      {formatDate(selectedUser.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? "保存中..." : "保存"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setIsEditing(false);
                      setEditFormData(null);
                    }}
                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                  >
                    關閉
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

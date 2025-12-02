"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  AlertCircle,
  Save,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/admin/Toast";
import AdminTableSkeleton from "@/components/admin/AdminTableSkeleton";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface InquiryItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  quantity: number | null;
  purpose: string | null;
  budget: string | null;
  notes: string | null;
  specialRequest: string | null;
  deliveryDate: string | null;
  status: "PENDING" | "IN_PROGRESS" | "RESPONDED" | "CLOSED";
  assignedTo: string | null;
  response: string | null;
  respondedAt: string | null;
  respondedBy: string | null;
  createdAt: string;
  updatedAt: string;
  wineId: string | null;
  userId: string | null;
  wines: {
    id: string;
    nameZh: string;
    nameEn: string;
    mainImageUrl: string | null;
  } | null;
  users: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<string>("");
  const [responseText, setResponseText] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchInquiries();
  }, [pagination.page, filterStatus, searchTerm]);

  // 當選擇詢價單時，初始化狀態和回覆
  useEffect(() => {
    if (selectedInquiry) {
      setStatusUpdate(selectedInquiry.status);
      setResponseText(selectedInquiry.response || "");
    }
  }, [selectedInquiry]);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== "all" && { status: filterStatus }),
      });

      const response = await fetch(`/api/admin/orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInquiries(data.inquiries || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch inquiries", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      RESPONDED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      CLOSED: "bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300",
    };
    const labels = {
      PENDING: "待處理",
      IN_PROGRESS: "處理中",
      RESPONDED: "已回覆",
      CLOSED: "已完成",
    };
    const icons = {
      PENDING: Clock,
      IN_PROGRESS: AlertCircle,
      RESPONDED: CheckCircle,
      CLOSED: CheckCircle,
    };
    const Icon = icons[status as keyof typeof icons];
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
          styles[status as keyof typeof styles]
        }`}
      >
        <Icon className="w-3 h-3" />
        {labels[status as keyof typeof labels]}
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

  const handleUpdateInquiry = async () => {
    if (!selectedInquiry) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedInquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusUpdate,
          response: responseText || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // 更新列表中的詢價單
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === selectedInquiry.id ? data.inquiry : inq))
        );
        // 更新選中的詢價單
        setSelectedInquiry(data.inquiry);
        showToast("success", "詢價單更新成功");

        // 如果狀態變更或添加了回覆，發送郵件通知
        if (
          (statusUpdate !== selectedInquiry.status || responseText) &&
          selectedInquiry.email
        ) {
          try {
            await fetch("/api/admin/notifications/email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: selectedInquiry.email,
                subject: `ProWine 詢價單更新 - ${selectedInquiry.wines?.nameZh || "您的詢價單"}`,
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8">
                    <style>
                      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                      .header { background: #8B2635; color: white; padding: 20px; text-align: center; }
                      .content { padding: 20px; background: #f9f9f9; }
                      .status { display: inline-block; padding: 5px 10px; border-radius: 4px; margin: 10px 0; }
                      .status.pending { background: #fef3c7; color: #92400e; }
                      .status.in_progress { background: #dbeafe; color: #1e40af; }
                      .status.responded { background: #d1fae5; color: #065f46; }
                      .status.closed { background: #e5e7eb; color: #374151; }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <h1>ProWine 詢價單更新</h1>
                      </div>
                      <div class="content">
                        <p>親愛的 ${selectedInquiry.name}，</p>
                        <p>您的詢價單狀態已更新：</p>
                        <div class="status ${statusUpdate.toLowerCase()}">
                          ${statusUpdate === "PENDING" ? "待處理" : statusUpdate === "IN_PROGRESS" ? "處理中" : statusUpdate === "RESPONDED" ? "已回覆" : "已完成"}
                        </div>
                        ${responseText ? `<p>回覆內容：</p><p style="background: white; padding: 15px; border-left: 4px solid #8B2635; margin: 20px 0;">${responseText.replace(/\n/g, "<br>")}</p>` : ""}
                        <p>如有任何問題，歡迎隨時聯繫我們。</p>
                      </div>
                    </div>
                  </body>
                  </html>
                `,
              }),
            });
          } catch (emailError) {
            // Q22優化：使用logger替代console.error
            logger.error("Failed to send email notification", emailError instanceof Error ? emailError : new Error(String(emailError)));
            // 不影響主流程，只記錄錯誤
          }
        }
      } else {
        const error = await response.json();
        showToast("error", error.error || "更新失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Update inquiry error", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "更新失敗");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">詢價單管理</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            管理所有客戶詢價單與處理狀態
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
            placeholder="搜尋客戶姓名、Email、電話或備註..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
          >
            <option value="all">全部狀態</option>
            <option value="PENDING">待處理</option>
            <option value="IN_PROGRESS">處理中</option>
            <option value="RESPONDED">已回覆</option>
            <option value="CLOSED">已完成</option>
          </select>
        </div>
      </div>

      {/* Inquiries List */}
      {isLoading ? (
        <AdminTableSkeleton />
      ) : inquiries.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <Package className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            {searchTerm || filterStatus !== "all"
              ? "找不到符合條件的詢價單"
              : "尚未有詢價單"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <motion.div
                key={inquiry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* 左側：客戶資訊 */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                          {inquiry.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {inquiry.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {inquiry.phone}
                          </div>
                          {inquiry.users && (
                            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-xs">
                              會員
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(inquiry.status)}
                      </div>
                    </div>

                    {/* 產品資訊 */}
                    {inquiry.wines && (
                      <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                        {inquiry.wines.mainImageUrl && (
                          <div className="relative w-16 h-16 flex-shrink-0">
                            <Image
                              src={inquiry.wines.mainImageUrl}
                              alt={inquiry.wines.nameZh}
                              fill
                              className="object-cover rounded"
                              sizes="64px"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {inquiry.wines.nameZh}
                          </p>
                          {inquiry.wines.nameEn && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                              {inquiry.wines.nameEn}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 詢價資訊 */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {inquiry.quantity && (
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">數量：</span>
                          <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                            {inquiry.quantity}
                          </span>
                        </div>
                      )}
                      {inquiry.purpose && (
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">用途：</span>
                          <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                            {inquiry.purpose}
                          </span>
                        </div>
                      )}
                      {inquiry.budget && (
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">預算：</span>
                          <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                            {inquiry.budget}
                          </span>
                        </div>
                      )}
                      {inquiry.deliveryDate && (
                        <div>
                          <span className="text-neutral-500 dark:text-neutral-400">送達時間：</span>
                          <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                            {formatDate(inquiry.deliveryDate)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 備註 */}
                    {inquiry.notes && (
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                          {inquiry.notes}
                        </p>
                      </div>
                    )}

                    {/* 時間資訊 */}
                    <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        建立時間：{formatDate(inquiry.createdAt)}
                      </div>
                      {inquiry.respondedAt && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          回覆時間：{formatDate(inquiry.respondedAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右側：操作 */}
                  <div className="lg:w-32 flex lg:flex-col items-end lg:items-start gap-2">
                    <button
                      onClick={() => setSelectedInquiry(inquiry)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      查看詳情
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
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
                第 {pagination.page} / {pagination.totalPages} 頁（共 {pagination.total} 筆詢價單）
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

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedInquiry(null)}
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
                  詢價單詳情
                </h2>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* 狀態更新 */}
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    狀態管理
                  </h3>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                      狀態：
                    </label>
                    <select
                      value={statusUpdate}
                      onChange={(e) => setStatusUpdate(e.target.value)}
                      className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="PENDING">待處理</option>
                      <option value="IN_PROGRESS">處理中</option>
                      <option value="RESPONDED">已回覆</option>
                      <option value="CLOSED">已完成</option>
                    </select>
                    <div>{getStatusBadge(statusUpdate)}</div>
                  </div>
                </div>

                {/* 客戶資訊 */}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    客戶資訊
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-neutral-500 dark:text-neutral-400">姓名</label>
                      <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                        {selectedInquiry.name}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-500 dark:text-neutral-400">Email</label>
                      <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                        {selectedInquiry.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-500 dark:text-neutral-400">電話</label>
                      <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                        {selectedInquiry.phone}
                      </p>
                    </div>
                    {selectedInquiry.users && (
                      <div>
                        <label className="text-sm text-neutral-500 dark:text-neutral-400">會員</label>
                        <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                          {selectedInquiry.users.name || selectedInquiry.users.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 產品資訊 */}
                {selectedInquiry.wines && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      詢價產品
                    </h3>
                    <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                      {selectedInquiry.wines.mainImageUrl && (
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image
                            src={selectedInquiry.wines.mainImageUrl}
                            alt={selectedInquiry.wines.nameZh}
                            fill
                            className="object-cover rounded"
                            sizes="96px"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {selectedInquiry.wines.nameZh}
                        </p>
                        {selectedInquiry.wines.nameEn && (
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {selectedInquiry.wines.nameEn}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 詢價詳情 */}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    詢價詳情
                  </h3>
                  <div className="space-y-3">
                    {selectedInquiry.quantity && (
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">數量</span>
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                          {selectedInquiry.quantity}
                        </span>
                      </div>
                    )}
                    {selectedInquiry.purpose && (
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">用途</span>
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                          {selectedInquiry.purpose}
                        </span>
                      </div>
                    )}
                    {selectedInquiry.budget && (
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">預算</span>
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                          {selectedInquiry.budget}
                        </span>
                      </div>
                    )}
                    {selectedInquiry.deliveryDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">送達時間</span>
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                          {formatDate(selectedInquiry.deliveryDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 備註 */}
                {selectedInquiry.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      備註
                    </h3>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                      <p className="text-neutral-900 dark:text-neutral-100 whitespace-pre-line">
                        {selectedInquiry.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* 特殊要求 */}
                {selectedInquiry.specialRequest && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      特殊要求
                    </h3>
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                      <p className="text-neutral-900 dark:text-neutral-100 whitespace-pre-line">
                        {selectedInquiry.specialRequest}
                      </p>
                    </div>
                  </div>
                )}

                {/* 回覆表單 */}
                <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    回覆客戶
                  </h3>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={6}
                    placeholder="輸入回覆內容..."
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                  {selectedInquiry.response && selectedInquiry.respondedAt && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      上次回覆時間：{formatDate(selectedInquiry.respondedAt)}
                    </div>
                  )}
                </div>

                {/* 已存在的回覆資訊 */}
                {selectedInquiry.response && (
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      當前回覆內容
                    </h3>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-neutral-900 dark:text-neutral-100 whitespace-pre-line">
                        {selectedInquiry.response}
                      </p>
                      {selectedInquiry.respondedAt && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                          回覆時間：{formatDate(selectedInquiry.respondedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 時間資訊 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-neutral-500 dark:text-neutral-400">建立時間</label>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                      {formatDate(selectedInquiry.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-neutral-500 dark:text-neutral-400">最後更新</label>
                    <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                      {formatDate(selectedInquiry.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedInquiry(null);
                    setStatusUpdate("");
                    setResponseText("");
                  }}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                >
                  關閉
                </button>
                <button
                  onClick={handleUpdateInquiry}
                  disabled={isUpdating}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {isUpdating ? "保存中..." : "保存更新"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

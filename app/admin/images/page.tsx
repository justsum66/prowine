"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Upload,
  Trash2,
  Image as ImageIcon,
  Download,
  Eye,
  X,
  Loader2,
} from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import Image from "next/image";
import { useToast } from "@/components/admin/Toast";
import AdminImagesGridSkeleton from "@/components/admin/AdminImagesGridSkeleton";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface ImageItem {
  id: string;
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  format: string;
  size: number;
  folder: string;
  filename: string;
  createdAt: string;
}

export default function AdminImagesPage() {
  const { showToast } = useToast();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchImages();
  }, [pagination.page, searchTerm]);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/images?${params}`);
      if (response.ok) {
        const data = await response.json();
        setImages(data.images || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch images", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("確定要刪除此圖片嗎？此操作無法復原。")) return;

    try {
      const response = await fetch(`/api/admin/images?id=${imageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchImages();
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

  const handleUploadComplete = (urls: string[]) => {
    setShowUploader(false);
    fetchImages();
    showToast("success", `成功上傳 ${urls.length} 張圖片`);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            圖片管理
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            管理網站使用的所有圖片資源
          </p>
        </div>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label={showUploader ? "關閉上傳器" : "開啟上傳器"}
          aria-expanded={showUploader}
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          上傳圖片
        </button>
      </div>

      {/* Uploader */}
      {showUploader && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-800 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              上傳圖片
            </h2>
            <button
              onClick={() => setShowUploader(false)}
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
              aria-label="關閉上傳器"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
          <ImageUploader
            onUpload={handleUploadComplete}
            folder="prowine"
            multiple={true}
            maxFiles={10}
            enableCrop={true}
            enableCompress={true}
            generateSizes={true}
            addWatermark={false}
          />
        </motion.div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋圖片名稱..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 min-h-[44px]"
            aria-label="搜尋圖片名稱"
          />
        </div>
      </div>

      {/* Images Grid */}
      {isLoading ? (
        <AdminImagesGridSkeleton />
      ) : images.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <ImageIcon className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            {searchTerm ? "找不到符合條件的圖片" : "尚未上傳任何圖片"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div
                  className="relative aspect-square bg-neutral-100 dark:bg-neutral-700 cursor-pointer"
                  onClick={() => setPreviewImage(image)}
                >
                  <Image
                    src={image.thumbnailUrl}
                    alt={image.filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate mb-2">
                    {image.filename}
                  </p>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      {image.width} × {image.height}
                    </span>
                    <span>{formatFileSize(image.size)}</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setPreviewImage(image)}
                      className="flex-1 px-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded transition-colors"
                    >
                      預覽
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
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
                第 {pagination.page} / {pagination.totalPages} 頁
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

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {previewImage.filename}
                </h3>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="relative w-full aspect-video bg-neutral-100 dark:bg-neutral-700 rounded-lg overflow-hidden mb-4">
                <Image
                  src={previewImage.url}
                  alt={previewImage.filename}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400">尺寸</p>
                  <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                    {previewImage.width} × {previewImage.height}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400">格式</p>
                  <p className="text-neutral-900 dark:text-neutral-100 font-medium uppercase">
                    {previewImage.format}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400">大小</p>
                  <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                    {formatFileSize(previewImage.size)}
                  </p>
                </div>
                <div>
                  <p className="text-neutral-500 dark:text-neutral-400">資料夾</p>
                  <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                    {previewImage.folder}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  下載原圖
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(previewImage.url);
                    showToast("success", "圖片 URL 已複製到剪貼簿");
                  }}
                  className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  複製 URL
                </button>
                <button
                  onClick={() => handleDelete(previewImage.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  刪除
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

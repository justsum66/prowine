"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, CheckCircle2, Loader2, HelpCircle, AlertCircle, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/components/Toast";
import { logger } from "@/lib/utils/logger-production";

const returnFormSchema = z.object({
  orderNumber: z.string().min(1, "請輸入訂單編號"),
  reason: z.string().min(10, "請詳細說明退換貨原因"),
  type: z.enum(["return", "exchange"]).refine((val) => val !== undefined, {
    message: "請選擇退換貨類型",
  }),
  exchangeProductId: z.string().optional(),
  images: z.array(z.string()).optional(),
});

type ReturnFormData = z.infer<typeof returnFormSchema>;

interface ReturnApplicationFormProps {
  orderNumber: string;
  onClose: () => void;
}

export default function ReturnApplicationForm({
  orderNumber,
  onClose,
}: ReturnApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [showHelp, setShowHelp] = useState<Record<string, boolean>>({});
  const [charCount, setCharCount] = useState({ reason: 0 });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      orderNumber,
      type: "return",
    },
  });

  const returnType = watch("type");
  const reasonValue = watch("reason");

  // 字數統計
  useEffect(() => {
    setCharCount({ reason: reasonValue?.length || 0 });
  }, [reasonValue]);

  const handleImageUpload = async (files: FileList) => {
    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });
      formData.append("folder", "returns");

      const response = await fetch("/api/upload", {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadedImages([...uploadedImages, ...result.files.map((f: any) => f.url)]);
      } else {
        throw new Error("圖片上傳失敗");
      }
    } catch (error) {
      logger.error(
        "Error uploading images",
        error instanceof Error ? error : new Error(String(error)),
        { component: "ReturnApplicationForm", orderNumber }
      );
      alert("圖片上傳失敗，請稍後再試");
    } finally {
      setUploadingImages(false);
    }
  };

  const onSubmit = async (data: ReturnFormData) => {
    setIsSubmitting(true);
    setSubmitProgress(0);
    
    // 模擬提交進度
    const progressInterval = setInterval(() => {
      setSubmitProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    try {
      // 獲取客戶資訊（優先使用 AuthContext，否則使用 localStorage）
      const customerEmail = user?.email || localStorage.getItem("userEmail") || "";
      const customerName = user?.name || localStorage.getItem("userName") || "";

      const response = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          images: uploadedImages,
          customerEmail,
          customerName,
        }),
      });

      if (response.ok) {
        setSubmitProgress(100);
        clearInterval(progressInterval);
        setIsSuccess(true);
        toast.success("退換貨申請已提交！我們將在 24 小時內與您聯繫。");
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "提交失敗");
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      setSubmitProgress(0);
      logger.error(
        "Error submitting return application",
        error instanceof Error ? error : new Error(String(error)),
        { component: "ReturnApplicationForm", orderNumber }
      );
      toast.error(error.message || "提交失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 p-8"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-2xl font-serif font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            申請已提交
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            我們已收到您的退換貨申請，將在 24 小時內與您聯繫。
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            申請編號：RET-{Date.now().toString().slice(-8)}
          </p>
        </div>
        
        {/* 推薦操作 */}
        <div className="border-t border-green-200 dark:border-green-800 pt-4 mt-4">
          <p className="text-sm text-green-700 dark:text-green-300 mb-3 font-medium text-center">
            您也可以：
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/account/orders"
              className="px-4 py-2 bg-white dark:bg-neutral-800 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm font-medium flex items-center justify-center gap-2 min-h-[44px]"
              onClick={onClose}
            >
              <Sparkles className="w-4 h-4" />
              查看訂單狀態
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg border border-neutral-200 p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-semibold text-neutral-900">
          退換貨申請表
        </h2>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-600"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* 提交進度條 */}
      {isSubmitting && submitProgress > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">提交中...</span>
            <span className="text-sm font-medium text-primary-600">{submitProgress}%</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${submitProgress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
            訂單編號 <span className="text-primary-600">*</span>
            <button
              type="button"
              onClick={() => setShowHelp({ ...showHelp, orderNumber: !showHelp.orderNumber })}
              className="text-neutral-400 hover:text-primary-600 transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] flex items-center justify-center"
              aria-label="訂單編號欄位說明"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </label>
          {showHelp.orderNumber && (
            <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
              請輸入您的訂單編號，可在訂單確認郵件或帳戶頁面找到
            </div>
          )}
          <input
            {...register("orderNumber")}
            type="text"
            className={`input min-h-[44px] md:min-h-[auto] ${errors.orderNumber ? "input-error" : ""}`}
            placeholder="請輸入訂單編號"
          />
          {errors.orderNumber && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errors.orderNumber.message}</span>
            </motion.p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            退換貨類型 <span className="text-primary-600">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="return"
                {...register("type")}
                className="w-4 h-4 text-primary-600"
              />
              <span>退貨</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="exchange"
                {...register("type")}
                className="w-4 h-4 text-primary-600"
              />
              <span>換貨</span>
            </label>
          </div>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {returnType === "exchange" && (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              換貨商品
            </label>
            <input
              type="text"
              className="input"
              placeholder="請輸入要換的商品編號或名稱"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              退換貨原因 <span className="text-primary-600">*</span>
              <button
                type="button"
                onClick={() => setShowHelp({ ...showHelp, reason: !showHelp.reason })}
                className="text-neutral-400 hover:text-primary-600 transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] flex items-center justify-center"
                aria-label="退換貨原因欄位說明"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </span>
            {charCount.reason > 0 && (
              <span className="text-xs text-neutral-500 font-normal">
                {charCount.reason} 字
              </span>
            )}
          </label>
          {showHelp.reason && (
            <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
              請詳細說明退換貨原因，例如：商品損壞、尺寸不合、收到錯誤商品等（至少 10 個字）
            </div>
          )}
          <textarea
            {...register("reason")}
            rows={6}
            className={`input min-h-[150px] ${errors.reason ? "input-error" : ""}`}
            placeholder="請詳細說明退換貨原因..."
            maxLength={500}
          />
          {charCount.reason > 0 && (
            <p className="mt-1 text-xs text-neutral-500 text-right">
              {charCount.reason} / 500 字
            </p>
          )}
          {errors.reason && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                {errors.reason.message}
                {errors.reason.type === "too_small" && "（至少需要 10 個字）"}
              </span>
            </motion.p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            商品照片（選填）
          </label>
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm text-neutral-600 mb-2">
              上傳商品照片有助於我們快速處理您的申請
            </p>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              id="image-upload"
              disabled={uploadingImages}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleImageUpload(e.target.files);
                }
              }}
            />
            <label
              htmlFor="image-upload"
              className={`inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors cursor-pointer text-sm font-medium ${
                uploadingImages ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {uploadingImages ? "上傳中..." : "選擇照片"}
            </label>
            {uploadedImages.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-neutral-200">
                    <Image
                      src={url}
                      alt={`退貨申請上傳圖片 ${index + 1}`}
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 640px) 33vw, 200px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>提交中...</span>
              </>
            ) : (
              "提交申請"
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}


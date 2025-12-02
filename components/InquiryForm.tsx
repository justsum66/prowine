"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, Loader2, CheckCircle2, HelpCircle, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/components/Toast";
import { logger } from "@/lib/utils/logger-production";

const inquirySchema = z.object({
  name: z.string().min(2, "姓名至少需要 2 個字元"),
  email: z.string().email("請輸入有效的電子郵件地址"),
  phone: z.string().min(8, "請輸入有效的電話號碼"),
  quantity: z.string().optional(),
  purpose: z.string().optional(),
  budget: z.string().optional(),
  notes: z.string().optional(),
  specialRequest: z.string().optional(),
  deliveryDate: z.string().optional(),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

interface InquiryFormProps {
  wineId?: string;
  wineName?: string;
  onSuccess?: () => void;
}

export default function InquiryForm({
  wineId,
  wineName,
  onSuccess,
}: InquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [showHelp, setShowHelp] = useState<Record<string, boolean>>({});
  const [charCount, setCharCount] = useState<Record<string, number>>({});
  const { user } = useAuth();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
  });

  // 智能填充：從用戶資料自動填充
  useEffect(() => {
    if (user) {
      if (user.name && !watch("name")) {
        setValue("name", user.name);
      }
      if (user.email && !watch("email")) {
        setValue("email", user.email);
      }
      if (user.phone && !watch("phone")) {
        setValue("phone", user.phone);
      }
    }
  }, [user, setValue, watch]);

  // 字數統計
  const watchedFields = watch();
  useEffect(() => {
    setCharCount({
      notes: watchedFields.notes?.length || 0,
      specialRequest: watchedFields.specialRequest?.length || 0,
    });
  }, [watchedFields.notes, watchedFields.specialRequest]);

  const onSubmit = async (data: InquiryFormData) => {
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
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          wineId,
        }),
      });

      if (response.ok) {
        setSubmitProgress(100);
        clearInterval(progressInterval);
        setIsSuccess(true);
        reset();
        toast.success("詢價已送出！我們將盡快與您聯繫。");
        setTimeout(() => {
          setIsSuccess(false);
          setSubmitProgress(0);
          onSuccess?.();
        }, 5000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "提交失敗");
      }
    } catch (error) {
      clearInterval(progressInterval);
      setSubmitProgress(0);
      logger.error(
        "Error submitting inquiry",
        error instanceof Error ? error : new Error(String(error)),
        { component: "InquiryForm", wineId, wineName }
      );
      toast.error(error instanceof Error ? error.message : "提交失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-neutral-900 mb-2">
          我要詢價
        </h2>
        {wineName && (
          <p className="text-neutral-600">
            關於：<span className="font-medium">{wineName}</span>
          </p>
        )}
      </div>

      {/* 提交成功動畫 */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl shadow-lg"
          >
            <div className="flex items-start gap-4 mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <CheckCircle2 className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
                  詢價已成功送出！
                </h3>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  我們已收到您的詢價，將在 24 小時內透過 Email 或電話與您聯繫。
                </p>
              </div>
            </div>
            
            {/* 推薦操作 */}
            <div className="border-t border-green-200 dark:border-green-800 pt-4 mt-4">
              <p className="text-sm text-green-700 dark:text-green-300 mb-3 font-medium">
                您也可以：
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/wines"
                  className="px-4 py-2 bg-white dark:bg-neutral-800 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm font-medium flex items-center gap-2 min-h-[44px]"
                >
                  <Sparkles className="w-4 h-4" />
                  瀏覽更多酒款
                </Link>
                <Link
                  href="/faq"
                  className="px-4 py-2 bg-white dark:bg-neutral-800 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm font-medium flex items-center gap-2 min-h-[44px]"
                >
                  <HelpCircle className="w-4 h-4" />
                  查看常見問題
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="inquiry-name" className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              姓名 <span className="text-primary-600" aria-label="必填">*</span>
              <button
                type="button"
                onClick={() => setShowHelp({ ...showHelp, name: !showHelp.name })}
                className="text-neutral-400 hover:text-primary-600 transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] flex items-center justify-center"
                aria-label="姓名欄位說明"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </label>
            {showHelp.name && (
              <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
                請輸入您的真實姓名，方便我們與您聯繫
              </div>
            )}
            <input
              {...register("name")}
              id="inquiry-name"
              type="text"
              className={`input min-h-[44px] md:min-h-[auto] ${errors.name ? "input-error" : ""}`}
              placeholder="請輸入您的姓名"
              autoComplete="name"
              aria-required="true"
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "name-error" : showHelp.name ? "name-help" : undefined}
            />
            {errors.name && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                id="name-error"
                className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5" 
                role="alert"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {errors.name.message}
                  {errors.name.type === "too_small" && "（至少需要 2 個字元）"}
                </span>
              </motion.p>
            )}
          </div>

          <div>
            <label htmlFor="inquiry-email" className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              電子郵件 <span className="text-primary-600" aria-label="必填">*</span>
              <button
                type="button"
                onClick={() => setShowHelp({ ...showHelp, email: !showHelp.email })}
                className="text-neutral-400 hover:text-primary-600 transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] flex items-center justify-center"
                aria-label="電子郵件欄位說明"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </label>
            {showHelp.email && (
              <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
                我們將透過此郵件地址回覆您的詢價
              </div>
            )}
            <input
              {...register("email")}
              id="inquiry-email"
              type="email"
              className={`input min-h-[44px] md:min-h-[auto] ${errors.email ? "input-error" : ""}`}
              placeholder="your@email.com"
              autoComplete="email"
              inputMode="email"
              aria-required="true"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : showHelp.email ? "email-help" : undefined}
            />
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                id="email-error"
                className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5" 
                role="alert"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {errors.email.message}
                  {errors.email.type === "invalid_string" && "（請確認格式是否正確，例如：user@example.com）"}
                </span>
              </motion.p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="inquiry-phone" className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
            聯絡電話 <span className="text-primary-600" aria-label="必填">*</span>
            <button
              type="button"
              onClick={() => setShowHelp({ ...showHelp, phone: !showHelp.phone })}
              className="text-neutral-400 hover:text-primary-600 transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] flex items-center justify-center"
              aria-label="電話欄位說明"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </label>
          {showHelp.phone && (
            <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
              請輸入可聯絡到您的手機或市話號碼（至少 8 位數字）
            </div>
          )}
          <input
            {...register("phone")}
            id="inquiry-phone"
            type="tel"
            className={`input min-h-[44px] md:min-h-[auto] ${errors.phone ? "input-error" : ""}`}
            placeholder="0912-345-678"
            autoComplete="tel"
            inputMode="tel"
            aria-required="true"
            aria-invalid={errors.phone ? "true" : "false"}
            aria-describedby={errors.phone ? "phone-error" : showHelp.phone ? "phone-help" : undefined}
          />
          {errors.phone && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              id="phone-error"
              className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5" 
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                {errors.phone.message}
                {errors.phone.type === "too_small" && "（請輸入至少 8 位數字）"}
              </span>
            </motion.p>
          )}
        </div>

        {/* Inquiry Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="inquiry-quantity" className="block text-sm font-medium text-neutral-700 mb-2">
              數量
            </label>
            <input
              {...register("quantity")}
              id="inquiry-quantity"
              type="text"
              className="input min-h-[44px] md:min-h-[auto]"
              placeholder="例如：6 瓶、1 箱"
              inputMode="text"
            />
          </div>

          <div>
            <label htmlFor="inquiry-purpose" className="block text-sm font-medium text-neutral-700 mb-2">
              用途
            </label>
            <select 
              {...register("purpose")} 
              id="inquiry-purpose"
              className="input min-h-[44px] md:min-h-[auto]"
              aria-label="選擇用途"
            >
              <option value="">請選擇</option>
              <option value="personal">個人飲用</option>
              <option value="gift">送禮</option>
              <option value="business">商務招待</option>
              <option value="collection">收藏</option>
              <option value="event">活動用酒</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="inquiry-budget" className="block text-sm font-medium text-neutral-700 mb-2">
              預算範圍
            </label>
            <select 
              {...register("budget")} 
              id="inquiry-budget"
              className="input min-h-[44px] md:min-h-[auto]"
              aria-label="選擇預算範圍"
            >
              <option value="">請選擇</option>
              <option value="500-1000">500-1,000 元</option>
              <option value="1000-2000">1,000-2,000 元</option>
              <option value="2000-5000">2,000-5,000 元</option>
              <option value="5000-10000">5,000-10,000 元</option>
              <option value="10000+">10,000 元以上</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              送達時間
            </label>
            <input
              {...register("deliveryDate")}
              type="date"
              className="input"
            />
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center justify-between">
            <span>備註</span>
            {charCount.notes > 0 && (
              <span className="text-xs text-neutral-500 font-normal">
                {charCount.notes} 字
              </span>
            )}
          </label>
          <textarea
            {...register("notes")}
            rows={4}
            className="input min-h-[120px]"
            placeholder="請告訴我們您的需求或任何特殊要求..."
            maxLength={500}
          />
          {charCount.notes > 0 && (
            <p className="mt-1 text-xs text-neutral-500 text-right">
              {charCount.notes} / 500 字
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center justify-between">
            <span>特殊要求</span>
            {charCount.specialRequest > 0 && (
              <span className="text-xs text-neutral-500 font-normal">
                {charCount.specialRequest} 字
              </span>
            )}
          </label>
          <textarea
            {...register("specialRequest")}
            rows={3}
            className="input min-h-[100px]"
            placeholder="例如：需要禮盒包裝、指定送達時間、特殊包裝等..."
            maxLength={300}
          />
          {charCount.specialRequest > 0 && (
            <p className="mt-1 text-xs text-neutral-500 text-right">
              {charCount.specialRequest} / 300 字
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>送出中...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>送出詢價</span>
            </>
          )}
        </button>

        <p className="text-xs text-neutral-500 text-center">
          送出詢價後，我們將在 24 小時內透過 Email 或電話與您聯繫
        </p>
      </form>
    </div>
  );
}


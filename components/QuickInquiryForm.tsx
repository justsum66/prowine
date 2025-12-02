"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle2, HelpCircle, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import FloatingLabelInput from "./FloatingLabelInput";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/components/Toast";
import { logger } from "@/lib/utils/logger-production";

interface QuickInquiryFormProps {
  wineId: string;
  wineName: string;
  onSuccess?: () => void;
  className?: string;
}

/**
 * 快速詢價表單組件（P2）
 * 固定位置的詢價按鈕和快速詢價模態框
 */
export default function QuickInquiryForm({
  wineId,
  wineName,
  onSuccess,
  className = "",
}: QuickInquiryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [showHelp, setShowHelp] = useState<Record<string, boolean>>({});
  const [charCount, setCharCount] = useState({ message: 0 });
  const { user } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    quantity: "1",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 智能填充：從用戶資料自動填充
  useEffect(() => {
    if (user && isOpen) {
      if (user.name && !formData.name) {
        setFormData((prev) => ({ ...prev, name: user.name || "" }));
      }
      if (user.email && !formData.email) {
        setFormData((prev) => ({ ...prev, email: user.email }));
      }
      if (user.phone && !formData.phone) {
        setFormData((prev) => ({ ...prev, phone: user.phone || "" }));
      }
    }
  }, [user, isOpen]);

  // 字數統計
  useEffect(() => {
    setCharCount({ message: formData.message.length });
  }, [formData.message]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "請輸入姓名";
    }

    if (!formData.email.trim()) {
      newErrors.email = "請輸入電子郵件";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "請輸入有效的電子郵件地址";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "請輸入電話號碼";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

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
          wineId,
          wineName,
          ...formData,
        }),
      });

      if (response.ok) {
        setSubmitProgress(100);
        clearInterval(progressInterval);
        setIsSuccess(true);
        toast.success("詢價已提交！我們會盡快與您聯繫。");
        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
          setSubmitProgress(0);
          setFormData({
            name: "",
            email: "",
            phone: "",
            quantity: "1",
            message: "",
          });
          onSuccess?.();
        }, 3000);
      } else {
        throw new Error("提交失敗");
      }
    } catch (error) {
      clearInterval(progressInterval);
      setSubmitProgress(0);
      logger.error(
        "Failed to submit inquiry",
        error instanceof Error ? error : new Error(String(error)),
        { component: "QuickInquiryForm", wineId, wineName }
      );
      setErrors({ submit: "提交失敗，請稍後再試" });
      toast.error("提交失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 固定詢價按鈕 */}
      <motion.button
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`
          fixed bottom-6 right-6 z-40
          px-6 py-3
          bg-primary-600 text-white
          rounded-full shadow-lg
          hover:bg-primary-700
          transition-colors
          flex items-center gap-2
          min-h-[56px]
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          ${className}
        `}
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`詢問 ${wineName} 的價格和庫存`}
      >
        <Send className="w-5 h-5" />
        <span className="font-medium">快速詢價</span>
      </motion.button>

      {/* 詢價模態框 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !isSubmitting && setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-labelledby="quick-inquiry-title"
              aria-modal="true"
            >
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="p-8"
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
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      詢價已提交
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      我們會盡快與您聯繫
                    </p>
                  </div>
                  
                  {/* 推薦操作 */}
                  <div className="border-t border-green-200 dark:border-green-800 pt-4 mt-4">
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3 font-medium text-center">
                      您也可以：
                    </p>
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/wines/${wineId}`}
                        className="px-4 py-2 bg-white dark:bg-neutral-800 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm font-medium flex items-center justify-center gap-2 min-h-[44px]"
                        onClick={() => setIsOpen(false)}
                      >
                        <Sparkles className="w-4 h-4" />
                        查看酒款詳情
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6" aria-labelledby="quick-inquiry-title">
                  <h3 id="quick-inquiry-title" className="text-2xl font-serif font-light text-neutral-900 dark:text-neutral-100 mb-2">
                    快速詢價
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                    詢問 {wineName} 的價格和庫存
                  </p>

                  <div className="space-y-4">
                    {/* 提交進度條 */}
                    {isSubmitting && submitProgress > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-neutral-600 dark:text-neutral-400">提交中...</span>
                          <span className="text-xs font-medium text-primary-600">{submitProgress}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${submitProgress}%` }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                          />
                        </div>
                      </div>
                    )}

                    <FloatingLabelInput
                      id="name"
                      label="姓名"
                      value={formData.name}
                      onChange={(value) => setFormData({ ...formData, name: value })}
                      error={errors.name}
                      required
                    />
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5 -mt-2"
                        role="alert"
                      >
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{errors.name}</span>
                      </motion.p>
                    )}

                    <FloatingLabelInput
                      id="email"
                      label="電子郵件"
                      type="email"
                      value={formData.email}
                      onChange={(value) => setFormData({ ...formData, email: value })}
                      error={errors.email}
                      required
                      autoComplete="email"
                    />
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5 -mt-2"
                        role="alert"
                      >
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{errors.email}</span>
                      </motion.p>
                    )}

                    <FloatingLabelInput
                      id="phone"
                      label="電話號碼"
                      type="tel"
                      value={formData.phone}
                      onChange={(value) => setFormData({ ...formData, phone: value })}
                      error={errors.phone}
                      required
                      autoComplete="tel"
                    />
                    {errors.phone && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5 -mt-2"
                        role="alert"
                      >
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{errors.phone}</span>
                      </motion.p>
                    )}

                    <FloatingLabelInput
                      id="quantity"
                      label="數量"
                      type="number"
                      value={formData.quantity}
                      onChange={(value) => setFormData({ ...formData, quantity: value })}
                      required
                    />

                    <div>
                      <FloatingLabelInput
                        id="message"
                        label="備註（選填）"
                        value={formData.message}
                        onChange={(value) => setFormData({ ...formData, message: value })}
                      />
                      {charCount.message > 0 && (
                        <p className="mt-1 text-xs text-neutral-500 text-right">
                          {charCount.message} / 200 字
                        </p>
                      )}
                    </div>

                    {errors.submit && (
                      <p className="text-sm text-red-500" role="alert" aria-live="polite">{errors.submit}</p>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        disabled={isSubmitting}
                        className="
                          flex-1 px-4 py-3
                          bg-neutral-100 dark:bg-neutral-700
                          text-neutral-700 dark:text-neutral-300
                          rounded-lg
                          hover:bg-neutral-200 dark:hover:bg-neutral-600
                          transition-colors
                          font-medium
                          disabled:opacity-50 disabled:cursor-not-allowed
                          focus:outline-none focus:ring-2 focus:ring-neutral-500
                        "
                        aria-label="關閉詢價表單"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="
                          flex-1 px-4 py-3
                          bg-primary-600 text-white
                          rounded-lg
                          hover:bg-primary-700
                          transition-colors
                          font-medium
                          disabled:opacity-50 disabled:cursor-not-allowed
                          flex items-center justify-center gap-2
                          focus:outline-none focus:ring-2 focus:ring-primary-500
                        "
                        aria-label={isSubmitting ? "正在提交詢價" : "提交詢價表單"}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>提交中...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>提交詢價</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


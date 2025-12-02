"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Send,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

interface InquiryFormMultiStepProps {
  wineId?: string;
  wineName?: string;
  onSuccess?: () => void;
}

const STEPS = [
  { id: 1, title: "基本資訊", fields: ["name", "email", "phone"] },
  {
    id: 2,
    title: "詢價詳情",
    fields: ["quantity", "purpose", "budget", "deliveryDate"],
  },
  { id: 3, title: "其他需求", fields: ["notes", "specialRequest"] },
];

export default function InquiryFormMultiStep({
  wineId,
  wineName,
  onSuccess,
}: InquiryFormMultiStepProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    trigger,
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    mode: "onChange",
  });

  const formData = watch();

  // 自動保存到 localStorage
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      if (Object.keys(formData).length > 0) {
        setAutoSaveStatus("saving");
        const savedData = {
          ...formData,
          wineId,
          timestamp: Date.now(),
        };
        localStorage.setItem("inquiry_form_draft", JSON.stringify(savedData));
        setTimeout(() => {
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus(null), 2000);
        }, 500);
      }
    }, 2000); // 2 秒後自動保存

    return () => clearTimeout(saveTimer);
  }, [formData, wineId]);

  // 載入草稿
  useEffect(() => {
    const draft = localStorage.getItem("inquiry_form_draft");
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.wineId === wineId && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
          // 7 天內的草稿
          Object.keys(parsed).forEach((key) => {
            if (key !== "wineId" && key !== "timestamp") {
              // @ts-ignore
              if (parsed[key]) {
                // @ts-ignore
                reset({ ...parsed, wineId: undefined, timestamp: undefined });
              }
            }
          });
        }
      } catch (error) {
        logger.error(
          "Failed to load draft",
          error instanceof Error ? error : new Error(String(error)),
          { component: "InquiryFormMultiStep", wineId }
        );
      }
    }
  }, [wineId, reset]);

  const validateStep = async (step: number) => {
    const stepFields = STEPS[step - 1].fields;
    const isValid = await trigger(stepFields as any);
    return isValid;
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);
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
        setIsSuccess(true);
        localStorage.removeItem("inquiry_form_draft");
        reset();
        setTimeout(() => {
          setIsSuccess(false);
          onSuccess?.();
        }, 3000);
      }
    } catch (error) {
      logger.error(
        "Error submitting inquiry",
        error instanceof Error ? error : new Error(String(error)),
        { component: "InquiryFormMultiStep", wineId, wineName }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

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

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    currentStep > step.id
                      ? "bg-primary-600 text-white"
                      : currentStep === step.id
                      ? "bg-primary-600 text-white ring-4 ring-primary-200"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {currentStep > step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.id
                  )}
                </div>
                <p className="mt-2 text-xs font-medium text-neutral-600">
                  {step.title}
                </p>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-colors ${
                    currentStep > step.id
                      ? "bg-primary-600"
                      : "bg-neutral-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <motion.div
            className="bg-primary-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Auto-save Status */}
      <AnimatePresence>
        {autoSaveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 flex items-center gap-2 text-sm text-neutral-600"
          >
            {autoSaveStatus === "saving" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>自動保存中...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>已自動保存</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-premium text-center py-16"
          >
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-neutral-900 mb-4">
              詢價已送出！
            </h3>
            <p className="text-neutral-600 mb-6">
              我們將盡快與您聯繫，通常在 24 小時內回覆
            </p>
          </motion.div>
        ) : (
          <motion.form
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="multi-inquiry-name" className="block text-sm font-medium text-neutral-700 mb-2">
                      姓名 <span className="text-primary-600" aria-label="必填">*</span>
                    </label>
                    <input
                      {...register("name")}
                      id="multi-inquiry-name"
                      type="text"
                      className="input min-h-[44px] md:min-h-[auto]"
                      placeholder="請輸入您的姓名"
                      autoComplete="name"
                      aria-required="true"
                      aria-invalid={errors.name ? "true" : "false"}
                      aria-describedby={errors.name ? "multi-name-error" : undefined}
                    />
                    {errors.name && (
                      <p id="multi-name-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="multi-inquiry-email" className="block text-sm font-medium text-neutral-700 mb-2">
                      電子郵件 <span className="text-primary-600" aria-label="必填">*</span>
                    </label>
                    <input
                      {...register("email")}
                      id="multi-inquiry-email"
                      type="email"
                      className="input min-h-[44px] md:min-h-[auto]"
                      placeholder="your@email.com"
                      autoComplete="email"
                      inputMode="email"
                      aria-required="true"
                      aria-invalid={errors.email ? "true" : "false"}
                      aria-describedby={errors.email ? "multi-email-error" : undefined}
                    />
                    {errors.email && (
                      <p id="multi-email-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="multi-inquiry-phone" className="block text-sm font-medium text-neutral-700 mb-2">
                    聯絡電話 <span className="text-primary-600" aria-label="必填">*</span>
                  </label>
                  <input
                    {...register("phone")}
                    id="multi-inquiry-phone"
                    type="tel"
                    className="input min-h-[44px] md:min-h-[auto]"
                    placeholder="0912-345-678"
                    autoComplete="tel"
                    inputMode="tel"
                    aria-required="true"
                    aria-invalid={errors.phone ? "true" : "false"}
                    aria-describedby={errors.phone ? "multi-phone-error" : undefined}
                  />
                  {errors.phone && (
                    <p id="multi-phone-error" className="mt-1 text-sm text-red-600" role="alert">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Inquiry Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      數量
                    </label>
                    <input
                      {...register("quantity")}
                      type="text"
                      className="input"
                      placeholder="例如：6 瓶、1 箱"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      用途
                    </label>
                    <select {...register("purpose")} className="input">
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
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      預算範圍
                    </label>
                    <select {...register("budget")} className="input">
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
              </div>
            )}

            {/* Step 3: Additional Information */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    備註
                  </label>
                  <textarea
                    {...register("notes")}
                    rows={4}
                    className="input"
                    placeholder="請告訴我們您的需求或任何特殊要求..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    特殊要求
                  </label>
                  <textarea
                    {...register("specialRequest")}
                    rows={3}
                    className="input"
                    placeholder="例如：需要禮盒包裝、指定送達時間、特殊包裝等..."
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                上一步
              </button>

              {currentStep < STEPS.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary px-6 py-2 flex items-center gap-2"
                >
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}


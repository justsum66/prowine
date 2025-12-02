"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2, HelpCircle, AlertCircle, Sparkles, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { createButtonProps } from "@/lib/utils/button-props";
import { logger } from "@/lib/utils/logger-production";

const step1Schema = z.object({
  name: z.string().min(2, "姓名至少需要 2 個字元"),
  email: z.string().email("請輸入有效的電子郵件地址"),
  phone: z.string().min(8, "請輸入有效的電話號碼"),
});

const step2Schema = z.object({
  subject: z.string().min(5, "主旨至少需要 5 個字元"),
});

const step3Schema = z.object({
  message: z.string().min(10, "訊息至少需要 10 個字元"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface MultiStepFormProps {
  onSubmit: (data: Step1Data & Step2Data & Step3Data) => Promise<void>;
  isSubmitting: boolean;
}

export default function MultiStepForm({ onSubmit, isSubmitting }: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data>>({});
  const [submitProgress, setSubmitProgress] = useState(0);
  const [showHelp, setShowHelp] = useState<Record<string, boolean>>({});
  const [charCount, setCharCount] = useState({ subject: 0, message: 0 });
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepTransition, setStepTransition] = useState<"forward" | "backward">("forward");
  const { user } = useAuth();
  const stepRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  // 智能填充：從用戶資料自動填充
  useEffect(() => {
    if (user && currentStep === 1) {
      if (user.name && !formData.name) {
        step1Form.setValue("name", user.name);
        setFormData((prev) => ({ ...prev, name: user.name }));
      }
      if (user.email && !formData.email) {
        step1Form.setValue("email", user.email);
        setFormData((prev) => ({ ...prev, email: user.email }));
      }
      if (user.phone && !formData.phone) {
        step1Form.setValue("phone", user.phone);
        setFormData((prev) => ({ ...prev, phone: user.phone }));
      }
    }
  }, [user, currentStep]);

  // 載入草稿
  useEffect(() => {
    const savedDraft = localStorage.getItem("contactFormDraft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
        step1Form.reset(draft);
        step2Form.reset(draft);
        step3Form.reset(draft);
        if (draft.subject) setCharCount((prev) => ({ ...prev, subject: draft.subject.length }));
        if (draft.message) setCharCount((prev) => ({ ...prev, message: draft.message.length }));
        
        // 根據已填寫的資料判斷完成的步驟
        const completed: number[] = [];
        if (draft.name && draft.email && draft.phone) completed.push(1);
        if (draft.subject) completed.push(2);
        if (draft.message) completed.push(3);
        setCompletedSteps(completed);
      } catch (e) {
        logger.error(
          "Failed to load draft",
          e instanceof Error ? e : new Error(String(e)),
          { component: "MultiStepForm" }
        );
      }
    }
  }, []);

  // 自動保存草稿
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem("contactFormDraft", JSON.stringify(formData));
    }
  }, [formData]);

  // 清除草稿
  const clearDraft = () => {
    localStorage.removeItem("contactFormDraft");
    setFormData({});
    step1Form.reset();
    step2Form.reset();
    step3Form.reset();
    setCharCount({ subject: 0, message: 0 });
  };

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: formData,
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: formData,
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: formData,
  });

  const handleStep1Next = step1Form.handleSubmit((data) => {
    setFormData({ ...formData, ...data });
    setCompletedSteps([...completedSteps.filter(s => s !== 1), 1]);
    setStepTransition("forward");
    setCurrentStep(2);
    // 滾動到頂部
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const handleStep2Next = step2Form.handleSubmit((data) => {
    setFormData({ ...formData, ...data });
    setCompletedSteps([...completedSteps.filter(s => s !== 2), 2]);
    setStepTransition("forward");
    setCurrentStep(3);
    // 滾動到頂部
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const handleStepBack = (step: number) => {
    setStepTransition("backward");
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStepClick = (step: number) => {
    // 只允許點擊已完成的步驟
    if (completedSteps.includes(step) && step !== currentStep) {
      setStepTransition(step < currentStep ? "backward" : "forward");
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStep3Submit = step3Form.handleSubmit(async (data) => {
    const finalData = { ...formData, ...data } as Step1Data & Step2Data & Step3Data;
    
    // 模擬提交進度
    setSubmitProgress(0);
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
      await onSubmit(finalData);
      setSubmitProgress(100);
      clearDraft();
      setTimeout(() => {
        setSubmitProgress(0);
        setCurrentStep(1);
      }, 2000);
    } catch (error) {
      clearInterval(progressInterval);
      setSubmitProgress(0);
    }
  });

  const steps = [
    { number: 1, title: "基本資訊" },
    { number: 2, title: "主旨" },
    { number: 3, title: "訊息內容" },
  ];

  return (
    <div>
      {/* 進度指示器 - 優化版 */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.number);
            const isCurrent = currentStep === step.number;
            const isPast = currentStep > step.number;
            const canClick = isCompleted && !isCurrent;

            return (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <motion.button
                    type="button"
                    onClick={() => canClick && handleStepClick(step.number)}
                    disabled={!canClick}
                    className={`relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold transition-all text-sm md:text-base ${
                      isCurrent
                        ? "bg-primary-600 text-white shadow-lg shadow-primary-600/50 scale-110"
                        : isCompleted || isPast
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400"
                    } ${
                      canClick
                        ? "cursor-pointer hover:scale-110 hover:shadow-lg transition-transform"
                        : "cursor-default"
                    }`}
                    whileHover={canClick ? { scale: 1.1 } : {}}
                    whileTap={canClick ? { scale: 0.95 } : {}}
                    ref={(el) => {
                      stepRefs.current[step.number] = el;
                    }}
                    aria-label={`步驟 ${step.number}: ${step.title}${isCompleted ? " (已完成)" : ""}${isCurrent ? " (當前步驟)" : ""}`}
                  >
                    {isCompleted || isPast ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6" />
                      </motion.div>
                    ) : (
                      step.number
                    )}
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-primary-400"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </motion.button>
                  <span className={`mt-1 md:mt-2 text-xs font-medium hidden sm:block transition-colors ${
                    isCurrent
                      ? "text-primary-600 dark:text-primary-400 font-semibold"
                      : isCompleted || isPast
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-neutral-600 dark:text-neutral-400"
                  }`}>
                    {step.title}
                  </span>
                  {isCurrent && (
                    <motion.div
                      className="hidden sm:block mt-1 h-1 w-8 bg-primary-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: 32 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <motion.div
                    className={`h-1 flex-1 mx-1 md:mx-2 rounded-full transition-colors ${
                      isPast || isCompleted
                        ? "bg-primary-600"
                        : "bg-neutral-200 dark:bg-neutral-700"
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{
                      scaleX: isPast || isCompleted ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {/* 步驟摘要提示 */}
        {completedSteps.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-neutral-500 dark:text-neutral-400 text-center"
          >
            已完成 {completedSteps.length} / {steps.length} 個步驟
          </motion.div>
        )}
      </div>

      {/* 表單內容 */}
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: stepTransition === "forward" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: stepTransition === "forward" ? -20 : 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            <h3 className="text-xl font-serif font-semibold text-neutral-900 mb-6">
              請填寫您的基本資訊
            </h3>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                姓名 <span className="text-primary-600">*</span>
                <button
                  type="button"
                  onClick={() => setShowHelp({ ...showHelp, name: !showHelp.name })}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
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
                {...step1Form.register("name")}
                type="text"
                className="input min-h-[44px] md:min-h-[auto]"
                placeholder="請輸入您的姓名"
                autoComplete="name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("email-input")?.focus();
                  }
                }}
              />
              {step1Form.formState.errors.name && (
                <div className="mt-1 flex items-start gap-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{step1Form.formState.errors.name.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                電子郵件 <span className="text-primary-600">*</span>
                <button
                  type="button"
                  onClick={() => setShowHelp({ ...showHelp, email: !showHelp.email })}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                  aria-label="電子郵件欄位說明"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </label>
              {showHelp.email && (
                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
                  我們將透過此郵件地址回覆您的詢問
                </div>
              )}
              <input
                {...step1Form.register("email")}
                id="email-input"
                type="email"
                className="input min-h-[44px] md:min-h-[auto]"
                placeholder="your@email.com"
                autoComplete="email"
                inputMode="email"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    document.getElementById("phone-input")?.focus();
                  }
                }}
              />
              {step1Form.formState.errors.email && (
                <div className="mt-1 flex items-start gap-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{step1Form.formState.errors.email.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                電話 <span className="text-primary-600">*</span>
                <button
                  type="button"
                  onClick={() => setShowHelp({ ...showHelp, phone: !showHelp.phone })}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                  aria-label="電話欄位說明"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </label>
              {showHelp.phone && (
                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
                  請輸入可聯絡到您的手機或市話號碼
                </div>
              )}
              <input
                {...step1Form.register("phone")}
                id="phone-input"
                type="tel"
                className="input min-h-[44px] md:min-h-[auto]"
                placeholder="0912-345-678"
                autoComplete="tel"
                inputMode="tel"
              />
              {step1Form.formState.errors.phone && (
                <div className="mt-1 flex items-start gap-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{step1Form.formState.errors.phone.message}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <motion.button
                onClick={handleStep1Next}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary flex items-center gap-2 min-h-[44px] md:min-h-[auto]"
              >
                下一步
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: stepTransition === "forward" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: stepTransition === "forward" ? -20 : 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            <h3 className="text-xl font-serif font-semibold text-neutral-900 mb-6">
              請選擇或輸入主旨
            </h3>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                主旨 <span className="text-primary-600">*</span>
                <button
                  type="button"
                  onClick={() => setShowHelp({ ...showHelp, subject: !showHelp.subject })}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                  aria-label="主旨欄位說明"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </label>
              {showHelp.subject && (
                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
                  選擇最符合您需求的主旨，有助於我們更快處理您的詢問
                </div>
              )}
              <select
                {...step2Form.register("subject")}
                id="multi-step-subject"
                className="input min-h-[44px] md:min-h-[auto] appearance-auto md:appearance-none"
                aria-required="true"
                aria-invalid={step2Form.formState.errors.subject ? "true" : "false"}
                aria-describedby={step2Form.formState.errors.subject ? "subject-error" : undefined}
                onChange={(e) => {
                  step2Form.setValue("subject", e.target.value);
                  setCharCount((prev) => ({ ...prev, subject: e.target.value.length }));
                  setFormData({ ...formData, subject: e.target.value });
                }}
              >
                <option value="">請選擇主旨</option>
                <option value="產品詢價">產品詢價</option>
                <option value="訂單查詢">訂單查詢</option>
                <option value="退換貨申請">退換貨申請</option>
                <option value="合作提案">合作提案</option>
                <option value="其他問題">其他問題</option>
              </select>
              <div className="mt-1 flex items-center justify-between">
                {step2Form.formState.errors.subject ? (
                  <div className="flex items-start gap-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{step2Form.formState.errors.subject.message}</span>
                  </div>
                ) : (
                  <div></div>
                )}
                <span className="text-xs text-neutral-500">
                  {charCount.subject}/100 字元
                </span>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <motion.button
                onClick={() => handleStepBack(1)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 md:px-6 py-3 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 active:bg-neutral-100 dark:active:bg-neutral-700 transition-colors font-medium flex items-center gap-2 min-h-[44px] md:min-h-[auto] touch-manipulation"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">上一步</span>
              </motion.button>
              <motion.button
                onClick={handleStep2Next}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary flex items-center gap-2 min-h-[44px] md:min-h-[auto] touch-manipulation flex-1 md:flex-none justify-center"
              >
                下一步
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: stepTransition === "forward" ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: stepTransition === "forward" ? -20 : 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-6"
          >
            <h3 className="text-xl font-serif font-semibold text-neutral-900 mb-6">
              請輸入您的訊息
            </h3>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                訊息內容 <span className="text-primary-600">*</span>
                <button
                  type="button"
                  onClick={() => setShowHelp({ ...showHelp, message: !showHelp.message })}
                  className="text-neutral-400 hover:text-primary-600 transition-colors"
                  aria-label="訊息內容欄位說明"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </label>
              {showHelp.message && (
                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
                  請詳細描述您的問題或需求，越詳細越能幫助我們快速為您處理
                </div>
              )}
              <textarea
                {...step3Form.register("message")}
                rows={6}
                className="input min-h-[120px] md:min-h-[auto] resize-none"
                placeholder="請詳細描述您的問題或需求..."
                onChange={(e) => {
                  step3Form.setValue("message", e.target.value);
                  setCharCount((prev) => ({ ...prev, message: e.target.value.length }));
                  setFormData({ ...formData, message: e.target.value });
                }}
                onFocus={(e) => {
                  // 手機版自動滾動到視圖
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                  }, 300);
                }}
                maxLength={1000}
              />
              <div className="mt-1 flex items-center justify-between">
                {step3Form.formState.errors.message ? (
                  <div className="flex items-start gap-1 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{step3Form.formState.errors.message.message}</span>
                  </div>
                ) : (
                  <div></div>
                )}
                <span className={`text-xs ${charCount.message > 900 ? "text-red-600" : "text-neutral-500"}`}>
                  {charCount.message}/1000 字元
                </span>
              </div>
            </div>

            {/* 提交進度條 */}
            {submitProgress > 0 && (
              <div className="mb-4">
                <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${submitProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1 text-right">
                  {submitProgress < 100 ? `提交中... ${submitProgress}%` : "提交完成！"}
                </p>
              </div>
            )}

            {/* 手機版固定底部提交按鈕 */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 p-4 z-40 safe-area-inset-bottom">
              <button
                {...createButtonProps(
                  handleStep3Submit,
                  {
                    className: "w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50",
                    disabled: isSubmitting || submitProgress > 0,
                  }
                )}
              >
                {isSubmitting || submitProgress > 0 ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>送出中...</span>
                  </>
                ) : (
                  <>
                    <span>送出訊息</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* 桌機版按鈕 */}
            <div className="hidden md:flex justify-between gap-3">
              <motion.button
                onClick={() => handleStepBack(2)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors font-medium flex items-center gap-2 min-h-[44px]"
              >
                <ArrowLeft className="w-5 h-5" />
                上一步
              </motion.button>
              <button
                {...createButtonProps(
                  handleStep3Submit,
                  {
                    className: "btn-primary flex items-center gap-2 disabled:opacity-50",
                    disabled: isSubmitting || submitProgress > 0,
                  }
                )}
              >
                {isSubmitting || submitProgress > 0 ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>送出中...</span>
                  </>
                ) : (
                  <>
                    <span>送出訊息</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, Loader2, MessageCircle, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";
import ContactPageSkeleton from "@/components/ContactPageSkeleton";
import { useToast } from "@/components/Toast";
import { logger } from "@/lib/utils/logger-production";

// 動態導入ContactMap組件（包含Google Maps API，只在需要時載入）
const ContactMap = dynamic(() => import("@/components/ContactMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-neutral-100 rounded-lg p-8 flex items-center justify-center h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-neutral-600 text-sm">載入地圖中...</p>
      </div>
    </div>
  ),
});
import MultiStepForm from "@/components/MultiStepForm";

const contactSchema = z.object({
  name: z.string().min(2, "姓名至少需要 2 個字元"),
  email: z.string().email("請輸入有效的電子郵件地址"),
  phone: z.string().min(8, "請輸入有效的電話號碼"),
  subject: z.string().min(5, "主旨至少需要 5 個字元"),
  message: z.string().min(10, "訊息至少需要 10 個字元"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isBusinessHours, setIsBusinessHours] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // 檢查營業時間
  useEffect(() => {
    const checkBusinessHours = () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();

      // 週一至週五 9:00-18:00
      if (day >= 1 && day <= 5 && hour >= 9 && hour < 18) {
        setIsBusinessHours(true);
      } else {
        setIsBusinessHours(false);
      }
    };

    checkBusinessHours();
    const interval = setInterval(checkBusinessHours, 60000); // 每分鐘檢查一次
    return () => clearInterval(interval);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsSuccess(true);
        reset();
        toast.success("訊息已成功送出！我們將盡快與您聯繫。");
        setTimeout(() => setIsSuccess(false), 5000);
      } else {
        throw new Error("提交失敗");
      }
    } catch (error) {
      logger.error(
        "Error submitting contact form",
        error instanceof Error ? error : new Error(String(error)),
        { component: "ContactPage" }
      );
      toast.error("提交失敗，請稍後再試");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <ContactPageSkeleton />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-neutral-50 py-16 md:py-20 lg:py-24">
        <div className="container-custom px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-neutral-900 mb-4 md:mb-6 leading-tight">
              聯絡我們
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-neutral-600 leading-relaxed">
              有任何問題或建議，歡迎隨時與我們聯繫
              <br className="hidden md:block" />
              <span className="md:hidden"> </span>
              我們將盡快為您提供專業的協助
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-12 md:py-16 bg-white">
        <div className="container-custom px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 mb-6 md:mb-8">
                聯絡資訊
              </h2>

              <div className="space-y-5 md:space-y-6 mb-6 md:mb-8">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-1.5 md:mb-2 text-sm md:text-base">地址</h3>
                    <div className="text-neutral-600 space-y-1 text-sm md:text-base">
                      <p><strong className="text-neutral-900">公司：</strong>新北市新店區中興路二段192號9樓</p>
                      <p><strong className="text-neutral-900">倉庫：</strong>新北市汐止區新台五路一段102號4樓</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 md:w-6 md:h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-1.5 md:mb-2 text-sm md:text-base">電話</h3>
                    <a
                      href="tel:+886-2-27329490"
                      className="text-primary-600 hover:text-primary-700 text-sm md:text-base block min-h-[44px] md:min-h-[auto] flex items-center"
                    >
                      +886-2-27329490
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 md:w-6 md:h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-1.5 md:mb-2 text-sm md:text-base">電子郵件</h3>
                    <a
                      href="mailto:service@prowine.com.tw"
                      className="text-primary-600 hover:text-primary-700 text-sm md:text-base break-all block min-h-[44px] md:min-h-[auto] flex items-center"
                    >
                      service@prowine.com.tw
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900 mb-1.5 md:mb-2 text-sm md:text-base">服務時間</h3>
                    <div className="text-neutral-600 space-y-1 text-sm md:text-base">
                      <p>週一至週五 9:00 - 18:00</p>
                      <p>週六 10:00 - 17:00</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div
                          className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${
                            isBusinessHours ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span className="text-xs md:text-sm font-medium">
                          {isBusinessHours ? "目前營業中" : "目前非營業時間"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 即時通訊 */}
              <div className="space-y-3 md:space-y-4">
                <h3 className="font-semibold text-neutral-900 mb-3 md:mb-4 text-base md:text-lg">即時通訊</h3>

                {/* LINE@ */}
                <a
                  href="https://line.me/R/ti/p/@415znht"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors group min-h-[64px] md:min-h-[auto]"
                  aria-label="開啟 LINE@ 官方帳號"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-neutral-900 group-hover:text-green-700 text-sm md:text-base">
                      LINE@ 官方帳號
                    </div>
                    <div className="text-xs md:text-sm text-neutral-600 truncate">@415znht</div>
                  </div>
                  <div className="text-green-600 group-hover:translate-x-1 transition-transform text-lg md:text-xl flex-shrink-0">
                    →
                  </div>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/886227329490"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors group min-h-[64px] md:min-h-[auto]"
                  aria-label="開啟 WhatsApp"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-neutral-900 group-hover:text-green-700 text-sm md:text-base">
                      WhatsApp
                    </div>
                    <div className="text-xs md:text-sm text-neutral-600">+886-2-27329490</div>
                  </div>
                  <div className="text-green-600 group-hover:translate-x-1 transition-transform text-lg md:text-xl flex-shrink-0">
                    →
                  </div>
                </a>
              </div>

              {/* 地圖 */}
              <div className="mt-8">
                <ContactMap />
              </div>
            </div>

            {/* Contact Form - 多步驟表單 */}
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 mb-6 md:mb-8">
                聯絡表單
              </h2>

              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="mb-4 md:mb-6 p-4 md:p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg"
                >
                  <div className="flex items-start gap-3 md:gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold text-green-900 dark:text-green-100 mb-1">
                        訊息已成功送出！
                      </h3>
                      <p className="text-green-700 dark:text-green-300 text-sm md:text-base">
                        我們已收到您的訊息，將在 24 小時內回覆您。
                      </p>
                    </div>
                  </div>
                  
                  {/* 推薦操作 - 桌機版 */}
                  <div className="hidden md:block border-t border-green-200 dark:border-green-800 pt-4 mt-4">
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3 font-medium">
                      您也可以：
                    </p>
                    <div className="flex gap-3">
                      <Link
                        href="/faq"
                        className="px-4 py-2 bg-white dark:bg-neutral-800 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        查看常見問題
                      </Link>
                      <a
                        href="https://line.me/R/ti/p/@415znht"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        加入 LINE@
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}

              <MultiStepForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

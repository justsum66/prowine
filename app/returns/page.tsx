"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Clock, Package, CheckCircle, XCircle, FileText, Upload, AlertCircle } from "lucide-react";
import ReturnApplicationForm from "@/components/ReturnApplicationForm";
import ReturnStatusTracker from "@/components/ReturnStatusTracker";

const returnSteps = [
  {
    step: 1,
    title: "聯繫客服",
    description: "透過 LINE@、電話或 Email 聯繫我們，提供訂單編號和退換貨原因",
  },
  {
    step: 2,
    title: "確認退換貨",
    description: "客服確認符合退換貨條件後，會安排物流取件",
  },
  {
    step: 3,
    title: "商品檢查",
    description: "收到商品後，我們會在 3-5 個工作天內完成檢查",
  },
  {
    step: 4,
    title: "完成處理",
    description: "檢查無誤後，完成退款或換貨處理",
  },
];

const returnConditions = [
  {
    icon: CheckCircle,
    title: "可以退換貨",
    items: [
      "收到商品後 7 天內",
      "商品保持原包裝完整",
      "商品未開封或使用",
      "非客製化商品",
      "商品本身有瑕疵或損壞",
    ],
    color: "green",
  },
  {
    icon: XCircle,
    title: "無法退換貨",
    items: [
      "超過 7 天退換貨期限",
      "商品已開封或使用",
      "人為損壞或保存不當",
      "非商品本身問題（如個人喜好改變）",
      "客製化商品",
    ],
    color: "red",
  },
];

export default function ReturnsPage() {
  const [showApplication, setShowApplication] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const checkEligibility = (orderNum: string) => {
    // 智能資格檢查邏輯
    // 這裡可以連接到 API 檢查訂單狀態、購買日期等
    return {
      eligible: true,
      reason: "符合退換貨條件",
      daysRemaining: 5,
    };
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <section className="bg-white border-b border-neutral-200">
        <div className="container-custom py-16">
          <div className="flex items-center gap-4 mb-4">
            <RefreshCw className="w-12 h-12 text-primary-600" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900">
              退換貨政策
            </h1>
          </div>
          <p className="text-lg text-neutral-600">
            完善的退換貨服務，保障您的權益
          </p>
        </div>
      </section>

      {/* Quick Check */}
      <section className="container-custom py-12">
        <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-8 mb-12">
          <h2 className="text-2xl font-serif font-semibold text-neutral-900 mb-6">
            快速資格檢查
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="輸入訂單編號"
              className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={() => {
                if (orderNumber) {
                  const result = checkEligibility(orderNumber);
                  if (result.eligible) {
                    setShowApplication(true);
                  } else {
                    alert(`不符合退換貨條件：${result.reason}`);
                  }
                }
              }}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              檢查資格
            </button>
          </div>
          {orderNumber && (
            <div className="mt-4">
              <ReturnStatusTracker orderNumber={orderNumber} />
            </div>
          )}
        </div>

        {/* Policy Overview */}
        <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-8 mb-12">
          <h2 className="text-3xl font-serif font-semibold text-neutral-900 mb-6">
            退換貨政策
          </h2>
          <div className="space-y-4 text-neutral-600 leading-relaxed">
            <p>
              我們提供完善的退換貨服務，確保您購買的商品符合您的期望。收到商品後
              7 天內，如商品保持原包裝完整且未開封，可申請退換貨。
            </p>
            <p>
              退換貨運費由我們負擔，我們會在收到商品後 3-5
              個工作天內完成檢查，確認無誤後立即處理退款或換貨。
            </p>
          </div>
        </div>

        {/* Return Steps */}
        <div className="mb-12">
          <h2 className="text-3xl font-serif font-semibold text-neutral-900 mb-8">
            退換貨流程
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {returnSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md border border-neutral-200 p-6 relative"
              >
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
                {index < returnSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <div className="w-6 h-0.5 bg-primary-300"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {returnConditions.map((condition, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`bg-white rounded-lg shadow-md border-2 ${
                condition.color === "green"
                  ? "border-green-200"
                  : "border-red-200"
              } p-8`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    condition.color === "green"
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  <condition.icon
                    className={`w-6 h-6 ${
                      condition.color === "green"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  />
                </div>
                <h3 className="text-2xl font-serif font-semibold text-neutral-900">
                  {condition.title}
                </h3>
              </div>
              <ul className="space-y-3">
                {condition.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-neutral-600"
                  >
                    <span
                      className={`mt-1 ${
                        condition.color === "green"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {condition.color === "green" ? "✓" : "✗"}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Online Application */}
        <AnimatePresence>
          {showApplication && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-12"
            >
              <ReturnApplicationForm
                orderNumber={orderNumber}
                onClose={() => setShowApplication(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Important Notes */}
        <div className="bg-primary-50 rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-serif font-semibold text-neutral-900 mb-4">
            重要提醒
          </h3>
          <ul className="space-y-2 text-neutral-700">
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-1">•</span>
              <span>
                退換貨申請需在收到商品後 7 天內提出，逾期恕不受理
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-1">•</span>
              <span>
                商品需保持原包裝完整，包含外盒、標籤、說明書等
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-1">•</span>
              <span>
                退款將退回原付款方式，處理時間約 5-7 個工作天
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-600 mt-1">•</span>
              <span>
                換貨商品需有現貨，如無現貨將改為退款處理
              </span>
            </li>
          </ul>
        </div>

        {/* Documents Download */}
        <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-8 mb-12">
          <h3 className="text-2xl font-serif font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" />
            相關文件下載
          </h3>
          <div className="space-y-3">
            <a
              href="/documents/return-policy.pdf"
              download
              className="flex items-center gap-3 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <FileText className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-neutral-900">退換貨政策完整版 (PDF)</span>
            </a>
            <a
              href="/documents/return-form.pdf"
              download
              className="flex items-center gap-3 p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <FileText className="w-5 h-5 text-primary-600" />
              <span className="font-medium text-neutral-900">退換貨申請表 (PDF)</span>
            </a>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-white rounded-lg shadow-md border border-neutral-200 p-8 text-center">
          <h3 className="text-2xl font-serif font-semibold text-neutral-900 mb-4">
            需要申請退換貨？
          </h3>
          <p className="text-neutral-600 mb-6">
            聯繫我們的客服團隊，我們會立即為您處理
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowApplication(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              線上申請
            </button>
            <a
              href="https://line.me/R/ti/p/@415znht"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              加入 LINE@ 申請
            </a>
            <a
              href="/contact"
              className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-colors font-medium"
            >
              聯絡我們
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

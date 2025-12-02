"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Package, Truck, AlertCircle } from "lucide-react";
import { logger } from "@/lib/utils/logger-production";

interface ReturnStatus {
  status: "pending" | "approved" | "picked_up" | "inspecting" | "completed" | "rejected";
  currentStep: number;
  estimatedDays: number;
  trackingNumber?: string;
}

interface ReturnStatusTrackerProps {
  orderNumber: string;
}

const statusSteps = [
  { id: 1, label: "申請提交", icon: CheckCircle2 },
  { id: 2, label: "審核通過", icon: CheckCircle2 },
  { id: 3, label: "物流取件", icon: Truck },
  { id: 4, label: "商品檢查", icon: Package },
  { id: 5, label: "處理完成", icon: CheckCircle2 },
];

export default function ReturnStatusTracker({ orderNumber }: ReturnStatusTrackerProps) {
  const [status, setStatus] = useState<ReturnStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/returns/${orderNumber}/status`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status);
        } else {
          // 如果沒有申請記錄，顯示預設狀態
          setStatus({
            status: "pending",
            currentStep: 0,
            estimatedDays: 7,
          });
        }
      } catch (error) {
        logger.error(
          "Failed to fetch return status",
          error instanceof Error ? error : new Error(String(error)),
          { component: "ReturnStatusTracker", orderNumber }
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (orderNumber) {
      fetchStatus();
    }
  }, [orderNumber]);

  if (isLoading) {
    return (
      <div className="p-4 bg-neutral-50 rounded-lg">
        <p className="text-sm text-neutral-600">載入中...</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 text-yellow-700">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">尚未找到此訂單的退換貨申請</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-neutral-200">
      <h3 className="text-lg font-semibold text-neutral-900 mb-4">
        申請進度追蹤
      </h3>
      <div className="space-y-4">
        {statusSteps.map((step, index) => {
          const isCompleted = index < status.currentStep;
          const isCurrent = index === status.currentStep;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isCurrent
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-200 text-neutral-400"
                }`}
              >
                <StepIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div
                  className={`font-medium ${
                    isCompleted || isCurrent
                      ? "text-neutral-900"
                      : "text-neutral-400"
                  }`}
                >
                  {step.label}
                </div>
                {isCurrent && (
                  <div className="text-sm text-primary-600 mt-1">
                    處理中...
                  </div>
                )}
                {isCompleted && (
                  <div className="text-sm text-green-600 mt-1">已完成</div>
                )}
              </div>
              {index < statusSteps.length - 1 && (
                <div
                  className={`absolute left-5 w-0.5 h-8 ${
                    isCompleted ? "bg-green-500" : "bg-neutral-200"
                  }`}
                  style={{ marginTop: "2.5rem" }}
                />
              )}
            </div>
          );
        })}
      </div>

      {status.trackingNumber && (
        <div className="mt-6 p-4 bg-primary-50 rounded-lg">
          <p className="text-sm text-neutral-700">
            <span className="font-semibold">物流追蹤編號：</span>
            {status.trackingNumber}
          </p>
        </div>
      )}

      <div className="mt-4 text-sm text-neutral-600">
        預計處理時間：{status.estimatedDays} 個工作天
      </div>
    </div>
  );
}


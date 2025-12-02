"use client";

import { useState, useEffect } from "react";
import {
  Package,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

interface OrderTrackingProps {
  orderNumber: string;
  status: OrderStatus;
  shippingMethod?: string;
  shippingAddress?: any;
  estimatedDelivery?: string;
  trackingNumber?: string;
  logisticsInfo?: {
    carrier?: string;
    trackingUrl?: string;
    currentLocation?: string;
    lastUpdate?: string;
  };
}

const statusConfig: Record<
  OrderStatus,
  { label: string; icon: any; color: string; bgColor: string }
> = {
  PENDING: {
    label: "待確認",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
  },
  CONFIRMED: {
    label: "已確認",
    icon: CheckCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  PROCESSING: {
    label: "處理中",
    icon: Package,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  SHIPPED: {
    label: "已出貨",
    icon: Truck,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  DELIVERED: {
    label: "已送達",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  CANCELLED: {
    label: "已取消",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  REFUNDED: {
    label: "已退款",
    icon: XCircle,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
};

const statusOrder: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export default function OrderTracking({
  orderNumber,
  status,
  shippingMethod,
  shippingAddress,
  estimatedDelivery,
  trackingNumber,
  logisticsInfo,
}: OrderTrackingProps) {
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);

  useEffect(() => {
    const index = statusOrder.indexOf(status);
    setCurrentStatusIndex(index >= 0 ? index : 0);
  }, [status]);

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
              訂單編號：{orderNumber}
            </h3>
            <div className="flex items-center gap-3">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor}`}
              >
                <StatusIcon className={`w-4 h-4 ${config.color}`} />
                <span className={`text-sm font-medium ${config.color}`}>
                  {config.label}
                </span>
              </div>
              {estimatedDelivery && status !== "DELIVERED" && (
                <span className="text-sm text-neutral-600">
                  預計送達：{estimatedDelivery}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {shippingAddress && (
          <div className="flex items-start gap-2 text-sm text-neutral-600">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-neutral-900 mb-1">運送地址</p>
              <p>
                {typeof shippingAddress === "string"
                  ? shippingAddress
                  : `${shippingAddress.name} ${shippingAddress.phone}\n${shippingAddress.address}`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h4 className="font-semibold text-neutral-900 mb-6">訂單狀態</h4>
        <div className="relative">
          {statusOrder.map((orderStatus, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const statusCfg = statusConfig[orderStatus];
            const Icon = statusCfg.icon;

            return (
              <div key={orderStatus} className="relative pb-8 last:pb-0">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isCompleted
                        ? `${statusCfg.bgColor} ${statusCfg.color} border-current`
                        : "bg-neutral-100 text-neutral-400 border-neutral-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p
                      className={`font-medium ${
                        isCompleted ? "text-neutral-900" : "text-neutral-400"
                      }`}
                    >
                      {statusCfg.label}
                    </p>
                    {isCurrent && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-neutral-600 mt-1"
                      >
                        進行中...
                      </motion.p>
                    )}
                  </div>
                </div>
                {index < statusOrder.length - 1 && (
                  <div
                    className={`absolute left-5 top-10 w-0.5 h-8 ${
                      isCompleted ? "bg-primary-600" : "bg-neutral-200"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Logistics Info */}
      {logisticsInfo && status === "SHIPPED" && (
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h4 className="font-semibold text-neutral-900 mb-4">物流資訊</h4>
          <div className="space-y-3">
            {trackingNumber && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">追蹤號碼</span>
                <span className="text-sm font-medium text-neutral-900">
                  {trackingNumber}
                </span>
              </div>
            )}
            {logisticsInfo.carrier && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">物流公司</span>
                <span className="text-sm font-medium text-neutral-900">
                  {logisticsInfo.carrier}
                </span>
              </div>
            )}
            {logisticsInfo.currentLocation && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">目前位置</span>
                <span className="text-sm font-medium text-neutral-900">
                  {logisticsInfo.currentLocation}
                </span>
              </div>
            )}
            {logisticsInfo.trackingUrl && (
              <a
                href={logisticsInfo.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-4 btn-primary text-center"
              >
                查看詳細物流資訊
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


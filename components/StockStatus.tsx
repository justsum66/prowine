"use client";

import { Package, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

interface StockStatusProps {
  stock: number;
  stockAlert?: number;
  showQuantity?: boolean;
  warehouse?: string;
}

export default function StockStatus({
  stock,
  stockAlert = 10,
  showQuantity = false,
  warehouse,
}: StockStatusProps) {
  const isInStock = stock > 0;
  const isLowStock = stock > 0 && stock <= stockAlert;
  const isOutOfStock = stock === 0;

  const getStatusConfig = () => {
    if (isOutOfStock) {
      return {
        icon: AlertTriangle,
        text: "缺貨中",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        message: "此商品目前缺貨，請聯繫我們了解補貨時間",
      };
    }
    if (isLowStock) {
      return {
        icon: AlertTriangle,
        text: "庫存不足",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        message: `僅剩 ${stock} 件，請盡快下單`,
      };
    }
    return {
      icon: CheckCircle,
      text: "有現貨",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      message: showQuantity ? `庫存：${stock} 件` : "有現貨，可立即出貨",
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border-2 ${config.borderColor} ${config.bgColor}`}
    >
      <div className="flex items-start gap-3">
        <div className={`${config.color} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-semibold ${config.color}`}>
              {config.text}
            </span>
            {showQuantity && isInStock && (
              <span className="text-sm text-neutral-600">
                ({stock} 件)
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-600">{config.message}</p>
          {warehouse && (
            <p className="text-xs text-neutral-500 mt-1">
              倉庫：{warehouse}
            </p>
          )}
          {isLowStock && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-xs text-yellow-700 hover:text-yellow-800 font-medium underline"
            >
              設定到貨通知
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}


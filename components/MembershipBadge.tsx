"use client";

import { Crown, Star, Gem } from "lucide-react";
import { motion } from "framer-motion";

type MembershipLevel = "REGULAR" | "VIP" | "PREMIUM";

interface MembershipBadgeProps {
  level: MembershipLevel;
  points?: number;
  showPoints?: boolean;
}

const membershipConfig = {
  REGULAR: {
    label: "一般會員",
    icon: Star,
    color: "text-neutral-600",
    bgColor: "bg-neutral-100",
    borderColor: "border-neutral-300",
  },
  VIP: {
    label: "VIP 會員",
    icon: Crown,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
  },
  PREMIUM: {
    label: "尊榮會員",
    icon: Gem,
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-300",
  },
};

export default function MembershipBadge({
  level,
  points = 0,
  showPoints = false,
}: MembershipBadgeProps) {
  const config = membershipConfig[level];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${config.borderColor} ${config.bgColor}`}
    >
      <Icon className={`w-5 h-5 ${config.color}`} />
      <span className={`font-semibold ${config.color}`}>{config.label}</span>
      {showPoints && points > 0 && (
        <span className={`text-sm ${config.color} opacity-75`}>
          {points.toLocaleString()} 積分
        </span>
      )}
    </motion.div>
  );
}


"use client";

import { motion } from "framer-motion";
import { Wine, Search, Inbox, AlertCircle } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  variant?: "default" | "search" | "error" | "wine";
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
}: EmptyStateProps) {
  const defaultIcons = {
    default: <Inbox className="w-16 h-16 md:w-20 md:h-20" />,
    search: <Search className="w-16 h-16 md:w-20 md:h-20" />,
    error: <AlertCircle className="w-16 h-16 md:w-20 md:h-20" />,
    wine: <Wine className="w-16 h-16 md:w-20 md:h-20" />,
  };

  const selectedIcon = icon || defaultIcons[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-12 md:py-20 px-4 text-center"
    >
      <div className="mb-6 text-neutral-400 dark:text-neutral-600">
        {selectedIcon}
      </div>
      <h3 className="text-xl md:text-2xl font-serif font-medium text-neutral-900 dark:text-neutral-100 mb-3">
        {title}
      </h3>
      {description && (
        <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className="btn-primary inline-flex items-center gap-2 min-h-[44px] px-6 py-3"
        >
          <span>{action.label}</span>
        </Link>
      )}
    </motion.div>
  );
}


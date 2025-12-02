"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { generateBreadcrumbSchema } from "@/lib/utils/structured-data";
import StructuredData from "./StructuredData";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb 導航組件
 * 包含結構化數據（SEO優化任務 #37）
 */
export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  // 確保第一個項目是首頁
  const breadcrumbItems: BreadcrumbItem[] = [
    { name: "首頁", url: "/" },
    ...items,
  ];

  return (
    <>
      {/* 結構化數據（SEO優化） */}
      <StructuredData
        type="breadcrumb"
        breadcrumbItems={breadcrumbItems}
      />

      {/* Breadcrumb UI */}
      <nav
        className={`flex items-center gap-2 text-sm text-neutral-600 ${className}`}
        aria-label="麵包屑導航"
      >
        <ol className="flex items-center gap-2 flex-wrap">
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;

            return (
              <li key={item.url} className="flex items-center gap-2">
                {index === 0 ? (
                  <Link
                    href={item.url}
                    className="hover:text-primary-600 transition-colors flex items-center gap-1"
                    aria-label="返回首頁"
                  >
                    <Home className="w-4 h-4" />
                    <span className="sr-only">首頁</span>
                  </Link>
                ) : isLast ? (
                  <span
                    className="text-neutral-900 font-medium"
                    aria-current="page"
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="hover:text-primary-600 transition-colors"
                  >
                    {item.name}
                  </Link>
                )}

                {!isLast && (
                  <ChevronRight className="w-4 h-4 text-neutral-400" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}


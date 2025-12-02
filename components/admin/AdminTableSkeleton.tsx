"use client";

/**
 * Admin 列表頁骨架屏
 * 用於在載入 Admin 列表數據時顯示佔位符
 */
export default function AdminTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header 骨架 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
          <div className="h-5 w-64 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Search and Filters 骨架 */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 space-y-4">
        <div className="h-12 w-full bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 w-24 bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Table 骨架 */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-neutral-200 dark:border-neutral-700">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
          ))}
        </div>

        {/* Table Rows */}
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid grid-cols-6 gap-4 p-4 border-b border-neutral-200 dark:border-neutral-700 last:border-b-0"
          >
            {Array.from({ length: 6 }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={`h-6 bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse ${
                  colIndex === 0 ? "w-3/4" : colIndex === 5 ? "w-1/2" : "w-full"
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination 骨架 */}
      <div className="flex items-center justify-between">
        <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 w-10 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}


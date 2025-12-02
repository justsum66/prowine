"use client";

/**
 * Admin 圖片網格骨架屏
 * 用於在載入 Admin 圖片列表時顯示佔位符
 */
export default function AdminImagesGridSkeleton() {
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
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700">
        <div className="h-12 w-full bg-neutral-200 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
      </div>

      {/* Images Grid 骨架 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden"
          >
            <div className="aspect-square bg-neutral-200 dark:bg-neutral-700 animate-pulse"></div>
            <div className="p-3 space-y-2">
              <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
              <div className="h-3 w-2/3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


"use client";

/**
 * Admin 儀表板骨架屏
 * 用於在載入 Admin Dashboard 數據時顯示佔位符
 */
export default function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header 骨架 */}
      <div>
        <div className="h-10 w-64 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mb-2"></div>
        <div className="h-6 w-96 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
      </div>

      {/* Stats Cards 骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
              <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
            </div>
            <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Charts 骨架 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6"
          >
            <div className="h-6 w-40 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mb-4"></div>
            <div className="h-[300px] w-full bg-neutral-100 dark:bg-neutral-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Quick Actions 骨架 */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
        <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 bg-neutral-100 dark:bg-neutral-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
}


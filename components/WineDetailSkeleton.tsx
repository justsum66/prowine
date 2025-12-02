"use client";

/**
 * 酒款詳情頁骨架屏
 * 用於在載入酒款詳情時顯示佔位符
 */
export default function WineDetailSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom px-4 md:px-6 py-8 md:py-12">
        {/* 返回按鈕骨架 */}
        <div className="mb-6 md:mb-8">
          <div className="h-10 w-24 bg-neutral-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
          {/* 圖片骨架 */}
          <div className="relative aspect-[3/4] bg-neutral-200 rounded-lg overflow-hidden animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 via-neutral-300 to-neutral-200"></div>
          </div>

          {/* 內容骨架 */}
          <div className="space-y-6">
            {/* 標題骨架 */}
            <div className="space-y-3">
              <div className="h-8 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-6 w-1/2 bg-neutral-200 rounded animate-pulse"></div>
            </div>

            {/* 酒莊名稱骨架 */}
            <div className="h-5 w-32 bg-neutral-200 rounded animate-pulse"></div>

            {/* 價格骨架 */}
            <div className="space-y-2">
              <div className="h-10 w-48 bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse"></div>
            </div>

            {/* 標籤骨架 */}
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-6 w-20 bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-6 w-24 bg-neutral-200 rounded animate-pulse"></div>
            </div>

            {/* 描述骨架 */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
            </div>

            {/* 按鈕骨架 */}
            <div className="flex gap-4 pt-4">
              <div className="h-12 w-32 bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-12 w-32 bg-neutral-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* 詳細信息骨架 */}
        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-2/3 bg-neutral-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-2/3 bg-neutral-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


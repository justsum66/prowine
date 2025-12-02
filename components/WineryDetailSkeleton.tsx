"use client";

/**
 * 酒莊詳情頁骨架屏
 * 用於在載入酒莊詳情時顯示佔位符
 */
export default function WineryDetailSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom px-4 md:px-6 py-8 md:py-12">
        {/* 返回按鈕骨架 */}
        <div className="mb-6 md:mb-8">
          <div className="h-10 w-24 bg-neutral-200 rounded animate-pulse"></div>
        </div>

        {/* Hero區域骨架 */}
        <div className="mb-12 md:mb-16">
          <div className="aspect-[16/6] bg-gradient-to-br from-neutral-200 via-neutral-300 to-neutral-200 rounded-lg overflow-hidden animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          {/* 左側主要內容 */}
          <div className="lg:col-span-2 space-y-8">
            {/* LOGO骨架 */}
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-neutral-200 rounded-full animate-pulse"></div>
            </div>

            {/* 標題骨架 */}
            <div className="text-center space-y-4">
              <div className="h-10 w-3/4 mx-auto bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-6 w-1/2 mx-auto bg-neutral-200 rounded animate-pulse"></div>
            </div>

            {/* 位置信息骨架 */}
            <div className="flex justify-center gap-4">
              <div className="h-6 w-24 bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse"></div>
            </div>

            {/* 描述骨架 */}
            <div className="space-y-3">
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
            </div>

            {/* 歷史/故事骨架 */}
            <div className="space-y-4">
              <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-neutral-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* 右側信息卡片 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
              {/* 酒款數量骨架 */}
              <div className="space-y-2">
                <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-neutral-200 rounded animate-pulse"></div>
              </div>

              {/* 產區信息骨架 */}
              <div className="space-y-2">
                <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse"></div>
                <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse"></div>
              </div>

              {/* 網站鏈接骨架 */}
              <div className="space-y-2">
                <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse"></div>
                <div className="h-10 w-full bg-neutral-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 酒款列表骨架 */}
        <div className="mt-16 space-y-6">
          <div className="h-8 w-48 bg-neutral-200 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="aspect-[3/4] bg-neutral-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


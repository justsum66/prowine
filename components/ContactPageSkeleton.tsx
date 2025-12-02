"use client";

/**
 * 聯絡頁骨架屏
 * 用於在載入聯絡頁面時顯示佔位符
 */
export default function ContactPageSkeleton() {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-ivory">
      <div className="container-custom py-12">
        {/* 標題區域骨架 */}
        <div className="text-center mb-12 space-y-4">
          <div className="h-12 w-1/3 mx-auto bg-neutral-200 rounded animate-pulse"></div>
          <div className="h-6 w-2/3 mx-auto bg-neutral-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* 左側：表單骨架 */}
          <div className="space-y-8">
            {/* 表單骨架 */}
            <div className="card-premium space-y-6">
              <div className="h-8 w-32 bg-neutral-200 rounded animate-pulse"></div>
              
              {/* 表單欄位骨架 */}
              <div className="space-y-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse"></div>
                    <div className="h-12 w-full bg-neutral-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>

              {/* 按鈕骨架 */}
              <div className="flex gap-4 pt-4">
                <div className="h-12 flex-1 bg-neutral-200 rounded animate-pulse"></div>
                <div className="h-12 w-24 bg-neutral-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* 營業時間骨架 */}
            <div className="card-premium space-y-4">
              <div className="h-7 w-32 bg-neutral-200 rounded animate-pulse"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex justify-between">
                    <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse"></div>
                    <div className="h-5 w-32 bg-neutral-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右側：聯絡資訊和地圖骨架 */}
          <div className="space-y-8">
            {/* 聯絡資訊骨架 */}
            <div className="card-premium space-y-6">
              <div className="h-8 w-32 bg-neutral-200 rounded animate-pulse"></div>
              
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="h-12 w-12 bg-neutral-200 rounded-lg animate-pulse flex-shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 地圖骨架 */}
            <div className="card-premium">
              <div className="h-[400px] w-full bg-neutral-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


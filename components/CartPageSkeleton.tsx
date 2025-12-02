"use client";

/**
 * 購物車頁骨架屏
 * 用於在載入購物車商品時顯示佔位符
 */
export default function CartPageSkeleton() {
  return (
    <div className="min-h-screen pt-24 pb-20 bg-ivory">
      <div className="container-custom py-12">
        {/* 標題骨架 */}
        <div className="mb-8 space-y-3">
          <div className="h-10 w-32 bg-neutral-200 rounded animate-pulse"></div>
          <div className="h-6 w-48 bg-neutral-200 rounded animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 購物車商品列表骨架 */}
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="card-premium">
                <div className="flex gap-6">
                  {/* 商品圖片骨架 */}
                  <div className="relative w-24 h-32 bg-neutral-200 rounded-lg animate-pulse flex-shrink-0"></div>

                  {/* 商品資訊骨架 */}
                  <div className="flex-1 space-y-3">
                    <div className="h-6 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-neutral-200 rounded animate-pulse"></div>
                    <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse"></div>
                    
                    {/* 數量控制骨架 */}
                    <div className="flex items-center gap-3 mt-4">
                      <div className="h-10 w-10 bg-neutral-200 rounded animate-pulse"></div>
                      <div className="h-10 w-16 bg-neutral-200 rounded animate-pulse"></div>
                      <div className="h-10 w-10 bg-neutral-200 rounded animate-pulse"></div>
                      <div className="h-10 w-10 bg-neutral-200 rounded animate-pulse ml-auto"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 訂單摘要骨架 */}
          <div className="lg:col-span-1">
            <div className="card-premium sticky top-24">
              <div className="space-y-6">
                <div className="h-8 w-32 bg-neutral-200 rounded animate-pulse"></div>
                
                {/* 價格詳情骨架 */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse"></div>
                    <div className="h-5 w-20 bg-neutral-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse"></div>
                    <div className="h-5 w-20 bg-neutral-200 rounded animate-pulse"></div>
                  </div>
                  <div className="border-t border-neutral-200 pt-4 flex justify-between">
                    <div className="h-6 w-24 bg-neutral-200 rounded animate-pulse"></div>
                    <div className="h-6 w-28 bg-neutral-200 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* 按鈕骨架 */}
                <div className="space-y-3 pt-4">
                  <div className="h-12 w-full bg-neutral-200 rounded animate-pulse"></div>
                  <div className="h-12 w-full bg-neutral-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


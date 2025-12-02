"use client";

/**
 * FAQ頁骨架屏
 * 用於在載入FAQ列表時顯示佔位符
 */
export default function FAQPageSkeleton() {
  return (
    <div className="min-h-screen bg-ivory pt-24 pb-20">
      <div className="container-custom py-12">
        {/* 標題區域骨架 */}
        <div className="text-center mb-12 space-y-4">
          <div className="h-12 w-1/3 mx-auto bg-neutral-200 rounded animate-pulse"></div>
          <div className="h-6 w-2/3 mx-auto bg-neutral-200 rounded animate-pulse"></div>
        </div>

        {/* 搜尋框骨架 */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="h-14 w-full bg-neutral-200 rounded-lg animate-pulse"></div>
        </div>

        {/* 分類按鈕骨架 */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-10 w-24 bg-neutral-200 rounded-full animate-pulse"></div>
          ))}
        </div>

        {/* FAQ項目骨架 */}
        <div className="max-w-4xl mx-auto space-y-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-premium border border-neutral-100">
              {/* 問題骨架 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
                  <div className="h-4 w-1/2 bg-neutral-200 rounded animate-pulse"></div>
                </div>
                <div className="h-6 w-6 bg-neutral-200 rounded animate-pulse ml-4"></div>
              </div>
              
              {/* 答案骨架（展開狀態） */}
              {index % 2 === 0 && (
                <div className="space-y-3 pt-4 border-t border-neutral-200">
                  <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                  <div className="h-4 w-5/6 bg-neutral-200 rounded animate-pulse"></div>
                  <div className="h-4 w-4/6 bg-neutral-200 rounded animate-pulse"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


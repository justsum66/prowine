"use client";

/**
 * 知識頁骨架屏
 * 用於在載入文章列表時顯示佔位符
 */
export default function KnowledgePageSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-custom px-4 md:px-6 py-8 md:py-12">
        {/* Hero區域骨架 */}
        <div className="text-center mb-12 space-y-4">
          <div className="h-12 w-3/4 mx-auto bg-neutral-200 rounded animate-pulse"></div>
          <div className="h-6 w-1/2 mx-auto bg-neutral-200 rounded animate-pulse"></div>
        </div>

        {/* 分類卡片骨架 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-6 space-y-3">
              <div className="h-12 w-12 mx-auto bg-neutral-200 rounded-lg animate-pulse"></div>
              <div className="h-6 w-24 mx-auto bg-neutral-200 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* 互動工具按鈕骨架 */}
        <div className="flex gap-3 mb-8">
          <div className="h-12 flex-1 md:flex-none md:w-32 bg-neutral-200 rounded-lg animate-pulse"></div>
          <div className="h-12 flex-1 md:flex-none md:w-32 bg-neutral-200 rounded-lg animate-pulse"></div>
          <div className="h-12 w-12 bg-neutral-200 rounded-lg animate-pulse"></div>
        </div>

        {/* 文章列表骨架 */}
        <div className="space-y-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg p-6 space-y-4">
              {/* 圖片骨架 */}
              <div className="aspect-video w-full bg-neutral-200 rounded-lg animate-pulse"></div>
              
              {/* 內容骨架 */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="h-5 w-20 bg-neutral-200 rounded animate-pulse"></div>
                  <div className="h-5 w-16 bg-neutral-200 rounded animate-pulse"></div>
                </div>
                
                <div className="h-8 w-3/4 bg-neutral-200 rounded animate-pulse"></div>
                <div className="h-6 w-1/2 bg-neutral-200 rounded animate-pulse"></div>
                
                <div className="space-y-2">
                  <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                  <div className="h-4 w-full bg-neutral-200 rounded animate-pulse"></div>
                  <div className="h-4 w-2/3 bg-neutral-200 rounded animate-pulse"></div>
                </div>
                
                <div className="flex gap-4 pt-2">
                  <div className="h-6 w-16 bg-neutral-200 rounded animate-pulse"></div>
                  <div className="h-6 w-16 bg-neutral-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


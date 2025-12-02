"use client";

import { useState, useEffect } from "react";
import { BarChart3, Clock, Zap, Image as ImageIcon } from "lucide-react";
import { performanceMonitor } from "@/lib/utils/performance-monitor-class";

export default function PerformanceDashboard() {
  const [report, setReport] = useState(performanceMonitor.getReport());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setReport(performanceMonitor.getReport());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible && process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl border border-neutral-200 p-4 z-50 max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-neutral-900">性能監控</h3>
        </div>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-neutral-400 hover:text-neutral-600"
        >
          {isVisible ? "−" : "+"}
        </button>
      </div>

      {isVisible && (
        <div className="space-y-4">
          {/* API Performance */}
          <div className="border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-neutral-700">API 響應</span>
            </div>
            <div className="text-xs text-neutral-600 space-y-1">
              <div className="flex justify-between">
                <span>平均：</span>
                <span className="font-medium">{report.api.average.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>最快：</span>
                <span className="font-medium text-green-600">{report.api.fastest.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>最慢：</span>
                <span className="font-medium text-red-600">{report.api.slowest.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>請求數：</span>
                <span className="font-medium">{report.api.count}</span>
              </div>
            </div>
          </div>

          {/* Render Performance */}
          <div className="border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-neutral-700">渲染時間</span>
            </div>
            <div className="text-xs text-neutral-600 space-y-1">
              <div className="flex justify-between">
                <span>平均：</span>
                <span className="font-medium">{report.render.average.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>最快：</span>
                <span className="font-medium text-green-600">{report.render.fastest.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>最慢：</span>
                <span className="font-medium text-red-600">{report.render.slowest.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>組件數：</span>
                <span className="font-medium">{report.render.count}</span>
              </div>
            </div>
          </div>

          {/* Image Performance */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-neutral-700">圖片載入</span>
            </div>
            <div className="text-xs text-neutral-600 space-y-1">
              <div className="flex justify-between">
                <span>平均：</span>
                <span className="font-medium">{report.image.average.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>最快：</span>
                <span className="font-medium text-green-600">{report.image.fastest.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>最慢：</span>
                <span className="font-medium text-red-600">{report.image.slowest.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>圖片數：</span>
                <span className="font-medium">{report.image.count}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => performanceMonitor.clear()}
            className="w-full mt-4 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-sm font-medium text-neutral-700 transition-colors"
          >
            清除數據
          </button>
        </div>
      )}
    </div>
  );
}


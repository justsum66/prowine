"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

export default function NewWineryPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nameZh: "",
    nameEn: "",
    descriptionZh: "",
    descriptionEn: "",
    storyZh: "",
    storyEn: "",
    region: "",
    country: "",
    website: "",
    logoUrl: "",
    featured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/wineries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        showToast("success", "酒莊創建成功");
        router.push(`/admin/wineries/${data.winery.id}/edit`);
      } else {
        const error = await response.json();
        showToast("error", error.error || "創建失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Create winery error", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "創建失敗");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/wineries"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              新增酒莊
            </h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold">基本資訊</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">中文名稱 *</label>
              <input
                type="text"
                required
                value={formData.nameZh}
                onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">英文名稱 *</label>
              <input
                type="text"
                required
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">產區</label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">國家</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">網站</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">LOGO URL</label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold">描述與故事</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">中文描述</label>
              <textarea
                rows={4}
                value={formData.descriptionZh}
                onChange={(e) => setFormData({ ...formData, descriptionZh: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">英文描述</label>
              <textarea
                rows={4}
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">中文故事</label>
              <textarea
                rows={6}
                value={formData.storyZh}
                onChange={(e) => setFormData({ ...formData, storyZh: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">英文故事</label>
              <textarea
                rows={6}
                value={formData.storyEn}
                onChange={(e) => setFormData({ ...formData, storyEn: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
              />
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-5 h-5"
              />
              <span>推薦酒莊</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/wineries"
            className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isLoading ? "創建中..." : "創建酒莊"}
          </button>
        </div>
      </form>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

export default function EditWineryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { showToast } = useToast();

  // Q21優化：定義類型接口，消除any
  interface WineryData {
    id: string;
    nameZh: string;
    nameEn: string;
    descriptionZh?: string;
    descriptionEn?: string;
    storyZh?: string;
    storyEn?: string;
    region?: string;
    country?: string;
    website?: string;
    logoUrl?: string;
    featured: boolean;
    [key: string]: unknown;
  }
  const [winery, setWinery] = useState<WineryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<WineryData> | null>(null);

  useEffect(() => {
    if (id) {
      fetchWinery();
    }
  }, [id]);

  const fetchWinery = async () => {
    try {
      const response = await fetch(`/api/admin/wineries/${id}`);
      if (response.ok) {
        const data = await response.json();
        setWinery(data.winery);
        setFormData({
          nameZh: data.winery.nameZh || "",
          nameEn: data.winery.nameEn || "",
          descriptionZh: data.winery.descriptionZh || "",
          descriptionEn: data.winery.descriptionEn || "",
          storyZh: data.winery.storyZh || "",
          storyEn: data.winery.storyEn || "",
          region: data.winery.region || "",
          country: data.winery.country || "",
          website: data.winery.website || "",
          logoUrl: data.winery.logoUrl || "",
          featured: data.winery.featured || false,
        });
      } else {
        showToast("error", "載入酒莊資料失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch winery", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "載入酒莊資料失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/wineries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast("success", "酒莊更新成功");
        router.push("/admin/wineries");
      } else {
        const error = await response.json();
        showToast("error", error.error || "更新失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Update error", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "更新失敗");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/wineries"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              編輯酒莊
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              {winery?.nameZh}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              基本資訊
            </h2>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                中文名稱 *
              </label>
              <input
                type="text"
                required
                value={formData.nameZh}
                onChange={(e) => setFormData({ ...formData, nameZh: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                英文名稱 *
              </label>
              <input
                type="text"
                required
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  產區
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  國家
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                網站
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                LOGO URL
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
              />
              {formData.logoUrl && (
                <img
                  src={formData.logoUrl}
                  alt="Logo Preview"
                  className="w-32 h-32 object-contain mt-2 rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              描述與故事
            </h2>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                中文描述
              </label>
              <textarea
                rows={4}
                value={formData.descriptionZh}
                onChange={(e) => setFormData({ ...formData, descriptionZh: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                英文描述
              </label>
              <textarea
                rows={4}
                value={formData.descriptionEn}
                onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                中文故事
              </label>
              <textarea
                rows={6}
                value={formData.storyZh}
                onChange={(e) => setFormData({ ...formData, storyZh: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                英文故事
              </label>
              <textarea
                rows={6}
                value={formData.storyEn}
                onChange={(e) => setFormData({ ...formData, storyEn: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-neutral-700 dark:text-neutral-300">推薦酒莊</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/wineries"
            className="px-6 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
}

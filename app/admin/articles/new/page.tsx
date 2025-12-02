"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

export default function NewArticlePage() {
  const router = useRouter();
  const { showToast } = useToast();
  // Q21優化：定義類型接口，消除any
  interface WineryOption {
    id: string;
    nameZh: string;
    nameEn: string;
  }
  const [wineries, setWineries] = useState<WineryOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    titleZh: "",
    titleEn: "",
    contentZh: "",
    contentEn: "",
    category: "WINE_KNOWLEDGE",
    tags: [] as string[],
    featuredImage: "",
    wineryId: "",
    published: false,
    featured: false,
    seoTitleZh: "",
    seoTitleEn: "",
    seoDescriptionZh: "",
    seoDescriptionEn: "",
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchWineries();
  }, []);

  const fetchWineries = async () => {
    try {
      const response = await fetch("/api/wineries");
      if (response.ok) {
        const data = await response.json();
        setWineries(data.wineries || []);
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch wineries", error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          wineryId: formData.wineryId || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast("success", "文章創建成功");
        router.push(`/admin/articles/${data.article.id}/edit`);
      } else {
        const error = await response.json();
        showToast("error", error.error || "創建失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Create article error", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "創建失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const categoryOptions = [
    { value: "WINE_KNOWLEDGE", label: "品酒知識" },
    { value: "WINERY_STORY", label: "酒莊故事" },
    { value: "PAIRING_TIPS", label: "搭配建議" },
    { value: "HEALTH_BENEFITS", label: "健康益處" },
    { value: "TASTING_TIPS", label: "品酒技巧" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/articles" className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">新增文章</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold">基本資訊</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">中文標題 *</label>
                  <input
                    type="text"
                    required
                    value={formData.titleZh}
                    onChange={(e) => setFormData({ ...formData, titleZh: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">英文標題 *</label>
                  <input
                    type="text"
                    required
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">分類 *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">關聯酒莊（選填）</label>
                  <select
                    value={formData.wineryId}
                    onChange={(e) => setFormData({ ...formData, wineryId: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
                  >
                    <option value="">無</option>
                    {wineries.map((winery) => (
                      <option key={winery.id} value={winery.id}>
                        {winery.nameZh}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">中文內容 *</label>
                <textarea
                  rows={10}
                  required
                  value={formData.contentZh}
                  onChange={(e) => setFormData({ ...formData, contentZh: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">英文內容 *</label>
                <textarea
                  rows={10}
                  required
                  value={formData.contentEn}
                  onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold">狀態設定</h2>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-5 h-5"
                />
                <span>發布</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-5 h-5"
                />
                <span>推薦</span>
              </label>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold">標籤</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="輸入標籤..."
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg"
                >
                  新增
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold">特色圖片 URL</h2>
              <input
                type="url"
                value={formData.featuredImage}
                onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/articles" className="px-6 py-2 border rounded-lg">取消</Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isLoading ? "創建中..." : "創建文章"}
          </button>
        </div>
      </form>
    </div>
  );
}


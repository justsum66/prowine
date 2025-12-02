"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { showToast } = useToast();
  // Q21優化：定義類型接口，消除any
  interface ArticleData {
    id: string;
    titleZh: string;
    titleEn: string;
    contentZh: string;
    contentEn: string;
    category: string;
    tags: string[];
    featuredImage: string;
    wineryId: string | null;
    published: boolean;
    featured: boolean;
    seoTitleZh: string;
    seoTitleEn: string;
    seoDescriptionZh: string;
    seoDescriptionEn: string;
  }
  interface WineryOption {
    id: string;
    nameZh: string;
    nameEn: string;
  }
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [wineries, setWineries] = useState<WineryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ArticleData> | null>(null);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (id) {
      Promise.all([fetchArticle(), fetchWineries()]);
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await fetch(`/api/admin/articles/${id}`);
      if (response.ok) {
        const data = await response.json();
        setArticle(data.article);
        setFormData({
          titleZh: data.article.titleZh || "",
          titleEn: data.article.titleEn || "",
          contentZh: data.article.contentZh || "",
          contentEn: data.article.contentEn || "",
          category: data.article.category || "WINE_KNOWLEDGE",
          tags: data.article.tags || [],
          featuredImage: data.article.featuredImage || "",
          wineryId: data.article.wineryId || "",
          published: data.article.published || false,
          featured: data.article.featured || false,
          seoTitleZh: data.article.seoTitleZh || "",
          seoTitleEn: data.article.seoTitleEn || "",
          seoDescriptionZh: data.article.seoDescriptionZh || "",
          seoDescriptionEn: data.article.seoDescriptionEn || "",
        });
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch article", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

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
    if (!formData) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          wineryId: formData.wineryId || null,
        }),
      });

      if (response.ok) {
        showToast("success", "文章更新成功");
        router.push("/admin/articles");
      } else {
        const errorData = await response.json();
        showToast("error", errorData.error || "更新失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Update error", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "更新失敗");
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && formData && formData.tags && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    if (formData && formData.tags) {
      setFormData({
        ...formData,
        tags: formData.tags.filter((t: string) => t !== tag),
      });
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">編輯文章</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">{article?.titleZh}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                  <label className="block text-sm font-medium mb-2">關聯酒莊</label>
                  <select
                    value={formData.wineryId || ""}
                    onChange={(e) => setFormData({ ...formData, wineryId: e.target.value || null })}
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
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
                <button type="button" onClick={addTag} className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                  新增
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(formData.tags || []).map((tag: string) => (
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
                placeholder="https://..."
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
              {formData.featuredImage && (
                <img
                  src={formData.featuredImage}
                  alt="Featured Image Preview"
                  className="w-full h-48 object-cover rounded-lg mt-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>

            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold">SEO 設定</h2>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  中文 SEO 標題
                </label>
                <input
                  type="text"
                  value={formData.seoTitleZh}
                  onChange={(e) => setFormData({ ...formData, seoTitleZh: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  英文 SEO 標題
                </label>
                <input
                  type="text"
                  value={formData.seoTitleEn}
                  onChange={(e) => setFormData({ ...formData, seoTitleEn: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  中文 SEO 描述
                </label>
                <textarea
                  rows={3}
                  value={formData.seoDescriptionZh}
                  onChange={(e) => setFormData({ ...formData, seoDescriptionZh: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  英文 SEO 描述
                </label>
                <textarea
                  rows={3}
                  value={formData.seoDescriptionEn}
                  onChange={(e) => setFormData({ ...formData, seoDescriptionEn: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/articles" className="px-6 py-2 border rounded-lg">取消</Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    </div>
  );
}


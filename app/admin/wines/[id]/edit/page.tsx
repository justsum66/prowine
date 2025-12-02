"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface Winery {
  id: string;
  nameZh: string;
  nameEn: string;
}

export default function EditWinePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { showToast } = useToast();
  
  // Q21優化：定義類型接口，消除any
  interface WineData {
    id: string;
    nameZh: string;
    nameEn: string;
    wineryId: string;
    category: string;
    price: number | string;
    stock?: number | string;
    stockAlert?: number | string;
    vintage?: number | string | null;
    region?: string;
    country?: string;
    descriptionZh?: string;
    descriptionEn?: string;
    mainImageUrl?: string;
    published: boolean;
    featured: boolean;
    bestseller?: boolean;
    grapeVarieties?: string[];
    keywords?: string[];
    alcoholContent?: number | string | null;
    servingTemp?: string;
    seoTitleZh?: string;
    seoTitleEn?: string;
    seoDescriptionZh?: string;
    seoDescriptionEn?: string;
  }
  const [wine, setWine] = useState<WineData | null>(null);
  const [wineries, setWineries] = useState<Winery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<WineData> | null>(null);
  const [grapeVarietyInput, setGrapeVarietyInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  useEffect(() => {
    if (id) {
      Promise.all([fetchWine(), fetchWineries()]);
    }
  }, [id]);

  const fetchWine = async () => {
    try {
      const response = await fetch(`/api/admin/wines/${id}`);
      if (response.ok) {
        const data = await response.json();
        setWine(data.wine);
        setFormData({
          nameZh: data.wine.nameZh || "",
          nameEn: data.wine.nameEn || "",
          wineryId: data.wine.wineryId || "",
          category: data.wine.category || "RED_WINE",
          price: data.wine.price?.toString() || "",
          stock: data.wine.stock?.toString() || "0",
          stockAlert: data.wine.stockAlert?.toString() || "10",
          descriptionZh: data.wine.descriptionZh || "",
          descriptionEn: data.wine.descriptionEn || "",
          region: data.wine.region || "",
          country: data.wine.country || "",
          vintage: data.wine.vintage?.toString() || "",
          grapeVarieties: data.wine.grapeVarieties || [],
          alcoholContent: data.wine.alcoholContent?.toString() || "",
          servingTemp: data.wine.servingTemp || "",
          mainImageUrl: data.wine.mainImageUrl || "",
          published: data.wine.published || false,
          featured: data.wine.featured || false,
          bestseller: data.wine.bestseller || false,
          seoTitleZh: data.wine.seoTitleZh || "",
          seoTitleEn: data.wine.seoTitleEn || "",
          seoDescriptionZh: data.wine.seoDescriptionZh || "",
          seoDescriptionEn: data.wine.seoDescriptionEn || "",
          keywords: data.wine.keywords || [],
        });
      } else {
        showToast("error", "載入酒款資料失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch wine", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "載入酒款資料失敗");
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
      const response = await fetch(`/api/admin/wines/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: typeof formData.price === 'string' ? parseFloat(formData.price) : (formData.price || 0),
          stock: typeof formData.stock === 'string' ? parseInt(formData.stock, 10) : (formData.stock || 0),
          stockAlert: typeof formData.stockAlert === 'string' ? parseInt(formData.stockAlert, 10) : (formData.stockAlert || 10),
          vintage: formData.vintage ? (typeof formData.vintage === 'string' ? parseInt(formData.vintage, 10) : formData.vintage) : null,
          alcoholContent: formData.alcoholContent ? (typeof formData.alcoholContent === 'string' ? parseFloat(formData.alcoholContent) : formData.alcoholContent) : null,
        }),
      });

      if (response.ok) {
        showToast("success", "酒款更新成功");
        router.push("/admin/wines");
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

  const addGrapeVariety = () => {
    const varieties = Array.isArray(formData?.grapeVarieties) ? formData.grapeVarieties : [];
    if (grapeVarietyInput.trim() && formData && !varieties.includes(grapeVarietyInput.trim())) {
      setFormData({
        ...formData,
        grapeVarieties: [...varieties, grapeVarietyInput.trim()],
      });
      setGrapeVarietyInput("");
    }
  };

  const removeGrapeVariety = (variety: string) => {
    if (formData && Array.isArray(formData.grapeVarieties)) {
      setFormData({
        ...formData,
        grapeVarieties: formData.grapeVarieties.filter((v: string) => v !== variety),
      });
    }
  };

  const addKeyword = () => {
    const keywords = Array.isArray(formData?.keywords) ? formData.keywords : [];
    if (keywordInput.trim() && formData && !keywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...keywords, keywordInput.trim()],
      });
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    if (formData && Array.isArray(formData.keywords)) {
      setFormData({
        ...formData,
        keywords: formData.keywords.filter((k: string) => k !== keyword),
      });
    }
  };

  const categoryOptions = [
    { value: "SPARKLING_WINE", label: "氣泡酒" },
    { value: "WHITE_WINE", label: "白酒" },
    { value: "ROSE_WINE", label: "粉紅酒" },
    { value: "RED_WINE", label: "紅酒" },
    { value: "NOBLE_ROT", label: "貴腐酒" },
    { value: "CHAMPAGNE", label: "香檳" },
  ];

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/wines"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              編輯酒款
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              {wine?.nameZh}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                基本資訊
              </h2>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    酒莊 *
                  </label>
                  <select
                    required
                    value={formData.wineryId}
                    onChange={(e) => setFormData({ ...formData, wineryId: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">選擇酒莊</option>
                    {wineries.map((winery) => (
                      <option key={winery.id} value={winery.id}>
                        {winery.nameZh} ({winery.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    分類 *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    價格 *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    年份
                  </label>
                  <input
                    type="number"
                    min="1900"
                    max="2100"
                    value={formData.vintage || ""}
                    onChange={(e) => setFormData({ ...formData, vintage: e.target.value || null })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    酒精度 (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.alcoholContent || ""}
                    onChange={(e) => setFormData({ ...formData, alcoholContent: e.target.value || null })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    產區
                  </label>
                  <input
                    type="text"
                    value={formData.region || ""}
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
                  適飲溫度
                </label>
                <input
                  type="text"
                  value={formData.servingTemp || ""}
                  onChange={(e) => setFormData({ ...formData, servingTemp: e.target.value })}
                  placeholder="例如：16-18°C"
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>

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
            </div>

            {/* Grape Varieties */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                葡萄品種
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={grapeVarietyInput}
                  onChange={(e) => setGrapeVarietyInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addGrapeVariety();
                    }
                  }}
                  placeholder="輸入葡萄品種..."
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
                <button
                  type="button"
                  onClick={addGrapeVariety}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600"
                >
                  新增
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(formData.grapeVarieties) ? formData.grapeVarieties : []).map((variety: string) => (
                  <span
                    key={variety}
                    className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg flex items-center gap-2"
                  >
                    {variety}
                    <button
                      type="button"
                      onClick={() => removeGrapeVariety(variety)}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                關鍵字
              </h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                  placeholder="輸入關鍵字..."
                  className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600"
                >
                  新增
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(formData.keywords) ? formData.keywords : []).map((keyword: string) => (
                  <span
                    key={keyword}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg flex items-center gap-2"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* SEO Fields */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                SEO 設定
              </h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  中文 SEO 標題
                </label>
                <input
                  type="text"
                  value={formData.seoTitleZh || ""}
                  onChange={(e) => setFormData({ ...formData, seoTitleZh: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  英文 SEO 標題
                </label>
                <input
                  type="text"
                  value={formData.seoTitleEn || ""}
                  onChange={(e) => setFormData({ ...formData, seoTitleEn: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  中文 SEO 描述
                </label>
                <textarea
                  rows={3}
                  value={formData.seoDescriptionZh || ""}
                  onChange={(e) => setFormData({ ...formData, seoDescriptionZh: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  英文 SEO 描述
                </label>
                <textarea
                  rows={3}
                  value={formData.seoDescriptionEn || ""}
                  onChange={(e) => setFormData({ ...formData, seoDescriptionEn: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                狀態設定
              </h2>

              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) =>
                      setFormData({ ...formData, published: e.target.checked })
                    }
                    className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-neutral-700 dark:text-neutral-300">發布</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData({ ...formData, featured: e.target.checked })
                    }
                    className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-neutral-700 dark:text-neutral-300">推薦</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.bestseller || false}
                    onChange={(e) =>
                      setFormData({ ...formData, bestseller: e.target.checked })
                    }
                    className="w-5 h-5 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-neutral-700 dark:text-neutral-300">熱門</span>
                </label>
              </div>
            </div>

            {/* Stock */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                庫存管理
              </h2>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  庫存數量
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock || ""}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  低庫存警示
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stockAlert || ""}
                  onChange={(e) => setFormData({ ...formData, stockAlert: e.target.value })}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            {/* Image */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                主圖片 URL
              </h2>
              <input
                type="url"
                value={formData.mainImageUrl}
                onChange={(e) => setFormData({ ...formData, mainImageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              />
              {formData.mainImageUrl && (
                <img
                  src={formData.mainImageUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/admin/wines"
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Upload } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/admin/Toast";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface Winery {
  id: string;
  nameZh: string;
  nameEn: string;
}

export default function NewWinePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [wineries, setWineries] = useState<Winery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nameZh: "",
    nameEn: "",
    wineryId: "",
    category: "RED_WINE",
    price: "",
    stock: "0",
    stockAlert: "10",
    descriptionZh: "",
    descriptionEn: "",
    region: "",
    country: "",
    vintage: "",
    grapeVarieties: [] as string[],
    alcoholContent: "",
    servingTemp: "",
    mainImageUrl: "",
    published: false,
    featured: false,
    bestseller: false,
    seoTitleZh: "",
    seoTitleEn: "",
    seoDescriptionZh: "",
    seoDescriptionEn: "",
    keywords: [] as string[],
  });
  const [grapeVarietyInput, setGrapeVarietyInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

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
      const response = await fetch("/api/admin/wines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          stockAlert: parseInt(formData.stockAlert),
          vintage: formData.vintage ? parseInt(formData.vintage) : null,
          alcoholContent: formData.alcoholContent ? parseFloat(formData.alcoholContent) : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showToast("success", "酒款創建成功");
        router.push(`/admin/wines/${data.wine.id}/edit`);
      } else {
        const error = await response.json();
        showToast("error", error.error || "創建失敗");
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Create wine error", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "創建失敗");
    } finally {
      setIsLoading(false);
    }
  };

  const addGrapeVariety = () => {
    if (grapeVarietyInput.trim() && !formData.grapeVarieties.includes(grapeVarietyInput.trim())) {
      setFormData({
        ...formData,
        grapeVarieties: [...formData.grapeVarieties, grapeVarietyInput.trim()],
      });
      setGrapeVarietyInput("");
    }
  };

  const removeGrapeVariety = (variety: string) => {
    setFormData({
      ...formData,
      grapeVarieties: formData.grapeVarieties.filter((v) => v !== variety),
    });
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keywordInput.trim()],
      });
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((k) => k !== keyword),
    });
  };

  const categoryOptions = [
    { value: "SPARKLING_WINE", label: "氣泡酒" },
    { value: "WHITE_WINE", label: "白酒" },
    { value: "ROSE_WINE", label: "粉紅酒" },
    { value: "RED_WINE", label: "紅酒" },
    { value: "NOBLE_ROT", label: "貴腐酒" },
    { value: "CHAMPAGNE", label: "香檳" },
  ];

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
              新增酒款
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              創建新的酒款資料
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
                    value={formData.price}
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
                    value={formData.vintage}
                    onChange={(e) => setFormData({ ...formData, vintage: e.target.value })}
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
                    value={formData.alcoholContent}
                    onChange={(e) => setFormData({ ...formData, alcoholContent: e.target.value })}
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
                {formData.grapeVarieties.map((variety) => (
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
                    checked={formData.bestseller}
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
                  value={formData.stock}
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
                  value={formData.stockAlert}
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
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            {isLoading ? "創建中..." : "創建酒款"}
          </button>
        </div>
      </form>
    </div>
  );
}


"use client";

import { useState } from "react";
import { Save } from "lucide-react";

interface WineFormProps {
  wine?: any;
  wineries: any[];
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export default function WineForm({ wine, wineries, onSubmit, isLoading = false }: WineFormProps) {
  const [formData, setFormData] = useState({
    nameZh: wine?.nameZh || "",
    nameEn: wine?.nameEn || "",
    wineryId: wine?.wineryId || "",
    category: wine?.category || "RED_WINE",
    price: wine?.price?.toString() || "",
    stock: wine?.stock?.toString() || "0",
    stockAlert: wine?.stockAlert?.toString() || "10",
    descriptionZh: wine?.descriptionZh || "",
    descriptionEn: wine?.descriptionEn || "",
    region: wine?.region || "",
    country: wine?.country || "",
    vintage: wine?.vintage?.toString() || "",
    grapeVarieties: wine?.grapeVarieties || [],
    alcoholContent: wine?.alcoholContent?.toString() || "",
    servingTemp: wine?.servingTemp || "",
    mainImageUrl: wine?.mainImageUrl || "",
    published: wine?.published || false,
    featured: wine?.featured || false,
    bestseller: wine?.bestseller || false,
    seoTitleZh: wine?.seoTitleZh || "",
    seoTitleEn: wine?.seoTitleEn || "",
    seoDescriptionZh: wine?.seoDescriptionZh || "",
    seoDescriptionEn: wine?.seoDescriptionEn || "",
    keywords: wine?.keywords || [],
  });

  const [grapeVarietyInput, setGrapeVarietyInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      stockAlert: parseInt(formData.stockAlert),
      vintage: formData.vintage ? parseInt(formData.vintage) : null,
      alcoholContent: formData.alcoholContent ? parseFloat(formData.alcoholContent) : null,
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
      grapeVarieties: formData.grapeVarieties.filter((v: string) => v !== variety),
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
      keywords: formData.keywords.filter((k: string) => k !== keyword),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info - 重用新增頁面的結構 */}
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
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
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
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            {/* 其他欄位... */}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status, Stock, Image 等側邊欄內容... */}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isLoading ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}


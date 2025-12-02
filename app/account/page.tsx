"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Edit2, Save, X } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

export default function AccountPage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Q21優化：定義類型接口，消除any
  interface UserWithAddress {
    name?: string;
    email: string;
    phone?: string;
    address?: string | Record<string, unknown>;
  }

  useEffect(() => {
    if (user) {
      const userWithAddress = user as UserWithAddress;
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: userWithAddress.address ? JSON.stringify(userWithAddress.address) : "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          address: formData.address ? JSON.parse(formData.address) : null,
        }),
      });

      if (response.ok) {
        await refreshUser();
        setIsEditing(false);
      }
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to save", error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-ivory flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-ivory">
        <div className="container-custom py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-serif font-light text-neutral-900 mb-4">
              請先登入
            </h1>
            <p className="text-neutral-600 font-light mb-8">
              登入後即可管理您的個人資料與訂單
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 border border-neutral-900 text-neutral-900 font-medium text-sm tracking-wider uppercase hover:bg-neutral-900 hover:text-white transition-all duration-300"
            >
              前往登入
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-ivory">
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          {/* 標題 */}
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-light text-neutral-900 mb-2">
              會員中心
            </h1>
            <p className="text-neutral-600 font-light">管理您的個人資料與訂單</p>
          </div>

          {/* 個人資料卡片 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-light text-neutral-900">
                個人資料
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:text-primary-600 border border-neutral-300 rounded-lg hover:border-primary-300 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="編輯個人資料"
                >
                  <Edit2 className="w-4 h-4" aria-hidden="true" />
                  編輯
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="保存個人資料"
                  >
                    <Save className="w-4 h-4" aria-hidden="true" />
                    {isSaving ? "保存中..." : "保存"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:text-neutral-900 border border-neutral-300 rounded-lg hover:border-neutral-400 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    aria-label="取消編輯"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                    取消
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  姓名
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                    aria-label="姓名"
                    aria-required="false"
                  />
                ) : (
                  <p className="text-neutral-900">{formData.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  電子郵件
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                    aria-label="電子郵件"
                    aria-required="false"
                    autoComplete="email"
                  />
                ) : (
                  <p className="text-neutral-900">{formData.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  電話
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                    aria-label="電話"
                    aria-required="false"
                    autoComplete="tel"
                  />
                ) : (
                  <p className="text-neutral-900">{formData.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  地址
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px]"
                    aria-label="地址"
                    aria-required="false"
                  />
                ) : (
                  <p className="text-neutral-900">{formData.address}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* 訂單歷史 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-premium"
          >
            <h2 className="text-2xl font-serif font-light text-neutral-900 mb-6">
              訂單歷史
            </h2>
            <div className="text-center py-12">
              <p className="text-neutral-500 font-light">尚無訂單記錄</p>
              <Link
                href="/wines"
                className="inline-block mt-4 px-6 py-3 border border-neutral-900 text-neutral-900 font-medium text-sm tracking-wider uppercase hover:bg-neutral-900 hover:text-white transition-all duration-300"
              >
                開始購物
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


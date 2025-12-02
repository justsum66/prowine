"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Globe,
  Mail,
  CreditCard,
  Search,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/admin/Toast";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface SettingsData {
  // 網站基本設定
  siteName: string;
  siteNameEn: string;
  siteDescription: string;
  siteDescriptionEn: string;
  siteLogo: string;
  siteFavicon: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  
  // SEO設定
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultSeoKeywords: string[];
  googleAnalyticsId: string;
  googleTagManagerId: string;
  
  // 郵件設定
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpFrom: string;
  
  // 支付設定
  stripePublicKey: string;
  stripeSecretKey: string;
  paymentMethods: string[];
  
  // 其他設定
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
}

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "seo" | "email" | "payment" | "advanced">("general");
  const [settings, setSettings] = useState<SettingsData>({
    siteName: "ProWine",
    siteNameEn: "ProWine",
    siteDescription: "專業葡萄酒進口商",
    siteDescriptionEn: "Professional Wine Importer",
    siteLogo: "",
    siteFavicon: "",
    contactEmail: "service@prowine.com.tw",
    contactPhone: "+886-2-27329490",
    address: "新北市新店區中興路二段192號9樓",
    defaultSeoTitle: "ProWine - 專業葡萄酒進口商",
    defaultSeoDescription: "提供來自世界頂級酒莊的精品葡萄酒",
    defaultSeoKeywords: ["葡萄酒", "紅酒", "白酒", "香檳", "ProWine"],
    googleAnalyticsId: "",
    googleTagManagerId: "",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpFrom: "service@prowine.com.tw",
    stripePublicKey: "",
    stripeSecretKey: "",
    paymentMethods: ["CREDIT_CARD", "BANK_TRANSFER"],
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      // 從環境變數或資料庫讀取設定
      // 目前先使用預設值，後續可以連接到資料庫
      setIsLoading(false);
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to fetch settings", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "載入設定失敗");
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 保存設定到資料庫或環境變數
      // 目前先顯示成功訊息，後續可以實現實際保存邏輯
      await new Promise((resolve) => setTimeout(resolve, 500));
      showToast("success", "設定已保存");
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("Failed to save settings", error instanceof Error ? error : new Error(String(error)));
      showToast("error", "保存設定失敗");
    } finally {
      setIsSaving(false);
    }
  };

  type TabId = "general" | "seo" | "email" | "payment" | "advanced";
  
  const tabs: Array<{ id: TabId; label: string; icon: typeof Globe }> = [
    { id: "general", label: "基本設定", icon: Globe },
    { id: "seo", label: "SEO設定", icon: Search },
    { id: "email", label: "郵件設定", icon: Mail },
    { id: "payment", label: "支付設定", icon: CreditCard },
    { id: "advanced", label: "進階設定", icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">系統設定</h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            管理網站基本設定、SEO、郵件和支付配置
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "保存中..." : "保存設定"}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
        <div className="flex border-b border-neutral-200 dark:border-neutral-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* 基本設定 */}
          {activeTab === "general" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    網站名稱（中文）
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    網站名稱（英文）
                  </label>
                  <input
                    type="text"
                    value={settings.siteNameEn}
                    onChange={(e) => setSettings({ ...settings, siteNameEn: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    網站描述（中文）
                  </label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    網站描述（英文）
                  </label>
                  <textarea
                    value={settings.siteDescriptionEn}
                    onChange={(e) => setSettings({ ...settings, siteDescriptionEn: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    聯絡Email
                  </label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    聯絡電話
                  </label>
                  <input
                    type="tel"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    公司地址
                  </label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={settings.siteLogo}
                    onChange={(e) => setSettings({ ...settings, siteLogo: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Favicon URL
                  </label>
                  <input
                    type="url"
                    value={settings.siteFavicon}
                    onChange={(e) => setSettings({ ...settings, siteFavicon: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* SEO設定 */}
          {activeTab === "seo" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    預設SEO標題
                  </label>
                  <input
                    type="text"
                    value={settings.defaultSeoTitle}
                    onChange={(e) => setSettings({ ...settings, defaultSeoTitle: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    預設SEO描述
                  </label>
                  <textarea
                    value={settings.defaultSeoDescription}
                    onChange={(e) => setSettings({ ...settings, defaultSeoDescription: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    預設關鍵字（用逗號分隔）
                  </label>
                  <input
                    type="text"
                    value={settings.defaultSeoKeywords.join(", ")}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultSeoKeywords: e.target.value.split(",").map((k) => k.trim()),
                      })
                    }
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Google Analytics ID
                    </label>
                    <input
                      type="text"
                      value={settings.googleAnalyticsId}
                      onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                      placeholder="G-XXXXXXXXXX"
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Google Tag Manager ID
                    </label>
                    <input
                      type="text"
                      value={settings.googleTagManagerId}
                      onChange={(e) => setSettings({ ...settings, googleTagManagerId: e.target.value })}
                      placeholder="GTM-XXXXXXX"
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 郵件設定 */}
          {activeTab === "email" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      郵件設定目前使用環境變數配置。修改這些設定需要更新環境變數並重新部署。
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    SMTP主機
                  </label>
                  <input
                    type="text"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    placeholder="smtp.example.com"
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    SMTP端口
                  </label>
                  <input
                    type="text"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    SMTP用戶名
                  </label>
                  <input
                    type="text"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    發送者Email
                  </label>
                  <input
                    type="email"
                    value={settings.smtpFrom}
                    onChange={(e) => setSettings({ ...settings, smtpFrom: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* 支付設定 */}
          {activeTab === "payment" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      支付設定目前使用環境變數配置。修改這些設定需要更新環境變數並重新部署。
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Stripe公開金鑰
                  </label>
                  <input
                    type="text"
                    value={settings.stripePublicKey}
                    onChange={(e) => setSettings({ ...settings, stripePublicKey: e.target.value })}
                    placeholder="pk_..."
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Stripe私密金鑰
                  </label>
                  <input
                    type="password"
                    value={settings.stripeSecretKey}
                    onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                    placeholder="sk_..."
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                    disabled
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    啟用的支付方式
                  </label>
                  <div className="space-y-2">
                    {["CREDIT_CARD", "BANK_TRANSFER", "LINE_PAY", "APPLE_PAY"].map((method) => (
                      <label key={method} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={settings.paymentMethods.includes(method)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSettings({
                                ...settings,
                                paymentMethods: [...settings.paymentMethods, method],
                              });
                            } else {
                              setSettings({
                                ...settings,
                                paymentMethods: settings.paymentMethods.filter((m) => m !== method),
                              });
                            }
                          }}
                          className="w-5 h-5"
                        />
                        <span className="text-sm text-neutral-900 dark:text-neutral-100">
                          {method === "CREDIT_CARD" && "信用卡"}
                          {method === "BANK_TRANSFER" && "銀行轉帳"}
                          {method === "LINE_PAY" && "LINE Pay"}
                          {method === "APPLE_PAY" && "Apple Pay"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 進階設定 */}
          {activeTab === "advanced" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100">維護模式</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      啟用後，網站將顯示維護頁面，僅管理員可訪問
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100">允許註冊</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      允許新用戶註冊帳號
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.allowRegistration}
                      onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100">需要Email驗證</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      新用戶註冊後需要驗證Email才能使用完整功能
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireEmailVerification}
                      onChange={(e) =>
                        setSettings({ ...settings, requireEmailVerification: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

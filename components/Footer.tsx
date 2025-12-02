"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Facebook, Instagram, MessageCircle, Mail, Phone, MapPin } from "lucide-react";
import { useTheme } from "@/lib/contexts/ThemeContext";
import Logo from "./Logo";

export default function Footer() {
  const router = useRouter();
  const navigatingRef = React.useRef<string | null>(null);

  const handleNavigation = (href: string, e: React.MouseEvent) => {
    // 防止重複點擊
    if (navigatingRef.current === href) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    navigatingRef.current = href;
    e.preventDefault();
    e.stopPropagation();
    
    // 使用 setTimeout 確保導航只執行一次
    setTimeout(() => {
      router.push(href);
      // 500ms 後重置，允許再次點擊
      setTimeout(() => {
        navigatingRef.current = null;
      }, 500);
    }, 0);
  };

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <footer className={`bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 transition-colors duration-500`} style={{ position: 'relative', zIndex: 30, pointerEvents: 'auto' }}>
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* 關於我們 - LOGO 精品級優化 */}
          <div>
            <div className="mb-6">
              <div className="relative w-40 h-auto">
                <Logo variant="footer" width={160} height={90} />
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-6 text-neutral-600 dark:text-neutral-400 font-light transition-colors duration-500">
              專業葡萄酒進口商，提供來自世界頂級酒莊的精品葡萄酒。每一瓶都訴說著獨特的風土故事。
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=100064003571961"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center hover:bg-primary-500 dark:hover:bg-accent-gold transition-all duration-300 touch-manipulation group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', minWidth: '44px', pointerEvents: 'auto', zIndex: 20 }}
                aria-label="在Facebook上關注我們（新視窗開啟）"
              >
                <Facebook className="w-4 h-4 text-neutral-700 dark:text-neutral-300 group-hover:text-white transition-colors duration-300" />
              </a>
              <a
                href="https://www.instagram.com/prowine2010/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center hover:bg-primary-500 dark:hover:bg-accent-gold transition-all duration-300 touch-manipulation group focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', minWidth: '44px', pointerEvents: 'auto', zIndex: 20 }}
                aria-label="在Instagram上關注我們（新視窗開啟）"
              >
                <Instagram className="w-4 h-4 text-neutral-700 dark:text-neutral-300 group-hover:text-white transition-colors duration-300" />
              </a>
              <a
                href="https://line.me/R/ti/p/@415znht"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center hover:bg-green-500 dark:hover:bg-green-400 transition-all duration-300 touch-manipulation group focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', minWidth: '44px', pointerEvents: 'auto', zIndex: 20 }}
                aria-label="在LINE上聯繫我們（新視窗開啟）"
              >
                <MessageCircle className="w-4 h-4 text-neutral-700 dark:text-neutral-300 group-hover:text-white transition-colors duration-300" />
              </a>
            </div>
          </div>

          {/* 快速連結 */}
          <nav aria-label="快速連結">
            <h3 className="text-neutral-900 dark:text-white font-serif text-lg font-light mb-5 transition-colors duration-500">
              快速連結
            </h3>
            <ul className="space-y-3" role="list">
              <li>
                <Link
                  href="/wines"
                  className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-accent-gold transition-colors duration-300 block font-light touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-2 py-1"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', display: 'flex', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (navigatingRef.current !== "/wines") {
                      navigatingRef.current = "/wines";
                      router.push("/wines");
                      setTimeout(() => {
                        navigatingRef.current = null;
                      }, 500);
                    }
                  }}
                  aria-label="前往臻選佳釀頁面"
                >
                  臻選佳釀
                </Link>
              </li>
              <li>
                <Link
                  href="/wineries"
                  className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-accent-gold transition-colors duration-300 block font-light touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', display: 'flex', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (navigatingRef.current !== "/wineries") {
                      navigatingRef.current = "/wineries";
                      router.push("/wineries");
                      setTimeout(() => {
                        navigatingRef.current = null;
                      }, 500);
                    }
                  }}
                  aria-label="酒莊風土"
                >
                  酒莊風土
                </Link>
              </li>
              <li>
                <Link
                  href="/knowledge"
                  className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-accent-gold transition-colors duration-300 block font-light touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', display: 'flex', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (navigatingRef.current !== "/knowledge") {
                      navigatingRef.current = "/knowledge";
                      router.push("/knowledge");
                      setTimeout(() => {
                        navigatingRef.current = null;
                      }, 500);
                    }
                  }}
                  aria-label="品酩學堂"
                >
                  品酩學堂
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-accent-gold transition-colors duration-300 block font-light touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', display: 'flex', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (navigatingRef.current !== "/about") {
                      navigatingRef.current = "/about";
                      router.push("/about");
                      setTimeout(() => {
                        navigatingRef.current = null;
                      }, 500);
                    }
                  }}
                  aria-label="關於 ProWine"
                >
                  關於 ProWine
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-accent-gold transition-colors duration-300 block font-light touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', display: 'flex', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (navigatingRef.current !== "/contact") {
                      navigatingRef.current = "/contact";
                      router.push("/contact");
                      setTimeout(() => {
                        navigatingRef.current = null;
                      }, 500);
                    }
                  }}
                  aria-label="聯絡我們"
                >
                  聯絡我們
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/login"
                  className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-accent-gold transition-colors duration-300 block font-light touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', display: 'flex', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}
                  aria-label="後台登入"
                >
                  後台登入
                </Link>
              </li>
            </ul>
          </nav>

          {/* 客戶服務 */}
          <nav aria-label="客戶服務">
            <h3 className="text-neutral-900 dark:text-white font-serif text-lg font-light mb-5 transition-colors duration-500">
              客戶服務
            </h3>
            <ul className="space-y-2.5" role="list">
              <li>
                <Link
                  href="/faq"
                  className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-accent-gold transition-colors duration-300 block font-light touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', display: 'flex', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (navigatingRef.current !== "/faq") {
                      navigatingRef.current = "/faq";
                      router.push("/faq");
                      setTimeout(() => {
                        navigatingRef.current = null;
                      }, 500);
                    }
                  }}
                  aria-label="常見問題"
                >
                  常見問題
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-accent-gold transition-colors duration-300 block font-light touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', display: 'flex', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (navigatingRef.current !== "/shipping") {
                      navigatingRef.current = "/shipping";
                      router.push("/shipping");
                      setTimeout(() => {
                        navigatingRef.current = null;
                      }, 500);
                    }
                  }}
                  aria-label="運送資訊"
                >
                  運送資訊
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-accent-gold transition-colors duration-300 block font-light touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', display: 'flex', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (navigatingRef.current !== "/returns") {
                      navigatingRef.current = "/returns";
                      router.push("/returns");
                      setTimeout(() => {
                        navigatingRef.current = null;
                      }, 500);
                    }
                  }}
                  aria-label="退換貨政策"
                >
                  退換貨政策
                </Link>
              </li>
            </ul>
          </nav>

          {/* 聯絡資訊 - 正確的資訊 */}
          <address>
            <h3 className="text-neutral-900 dark:text-white font-serif text-lg font-light mb-5 transition-colors duration-500">
              聯絡我們
            </h3>
            <ul className="space-y-3.5 text-sm" role="list">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary-600 dark:text-accent-gold flex-shrink-0 mt-0.5 transition-colors duration-500" />
                <div className="text-neutral-600 dark:text-neutral-400 font-light transition-colors duration-500">
                  <div className="font-medium text-neutral-900 dark:text-white mb-1 transition-colors duration-500">公司地址</div>
                  <div>新北市新店區中興路二段192號9樓</div>
                  <div className="font-medium text-neutral-900 dark:text-white mt-3 mb-1 transition-colors duration-500">倉庫地址</div>
                  <div>新北市汐止區新台五路一段102號4樓</div>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary-600 dark:text-accent-gold flex-shrink-0 transition-colors duration-500" />
                <a
                  href="tel:+886-2-27329490"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-accent-gold transition-colors duration-300 font-light touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', display: 'flex', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}
                  aria-label="電話：+886-2-27329490"
                >
                  +886-2-27329490
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary-600 dark:text-accent-gold flex-shrink-0 transition-colors duration-500" />
                <a
                  href="mailto:service@prowine.com.tw"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-accent-gold transition-colors duration-300 font-light touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', display: 'flex', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}
                  aria-label="電子郵件：service@prowine.com.tw"
                >
                  service@prowine.com.tw
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-primary-600 dark:text-accent-gold flex-shrink-0 transition-colors duration-500" />
                <a
                  href="https://line.me/R/ti/p/@415znht"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-accent-gold transition-colors duration-300 font-light touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  style={{ WebkitTapHighlightColor: 'transparent', minHeight: '44px', display: 'flex', alignItems: 'center', pointerEvents: 'auto', zIndex: 20 }}
                  aria-label="LINE@：@415znht（新視窗開啟）"
                >
                  LINE@: @415znht
                </a>
              </li>
            </ul>
          </address>
        </div>

        {/* 版權資訊 */}
        <div className="border-t border-neutral-200 dark:border-neutral-800 mt-12 pt-8 text-center text-xs text-neutral-500 dark:text-neutral-400 font-light transition-colors duration-500">
          <p>
            © {new Date().getFullYear()} ProWine 酩陽實業股份有限公司. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

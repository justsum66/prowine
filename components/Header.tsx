"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, Search, ShoppingCart, User, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useCart } from "@/lib/contexts/CartContext";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";
import Logo from "./Logo";
import { createButtonProps, createLinkProps } from "@/lib/utils/button-props";

// 代碼分割優化（P1 BATCH10）：動態導入搜尋模態框
const SearchModal = dynamic(() => import("./SearchModal"), {
  ssr: false,
  loading: () => null,
});

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMenuHovered, setIsMenuHovered] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const router = useRouter();
  const { itemCount: cartCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { user } = useAuth();

  // P0 #16：Header 高度動態變化 + P0 #25：移動端滑動隱藏
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrolled(currentScrollY > 20);
          
          // P0 #25：移動端滑動隱藏功能
          if (window.innerWidth < 1024) {
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
              // 向下滾動，隱藏 Header
              setHeaderVisible(false);
            } else if (currentScrollY < lastScrollY) {
              // 向上滾動，顯示 Header
              setHeaderVisible(true);
            }
          } else {
            // 桌面端始終顯示
            setHeaderVisible(true);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // 鍵盤快捷鍵：Ctrl/Cmd + K 開啟搜尋
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const menuItems = [
    { href: "/wines", label: "臻選佳釀" },
    { href: "/wineries", label: "酒莊風土" },
    { href: "/knowledge", label: "品酩學堂" },
    { href: "/about", label: "關於 ProWine" },
    { href: "/contact", label: "聯絡我們" },
  ];

  const handleSearch = () => {
    setSearchOpen(true);
  };

  const handleWishlist = () => {
    router.push("/wishlist");
  };

  const handleCart = () => {
    router.push("/cart");
  };

  const handleUser = () => {
    router.push("/account");
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl shadow-sm border-b border-neutral-200/50 dark:border-neutral-800/50"
            : "bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-100/50 dark:border-neutral-800/50"
        } ${
          headerVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <nav className="container-custom" role="navigation" aria-label="主要導航">
          <div className={`flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            scrolled ? "h-[72px]" : "h-24"
          }`}>
            {/* Logo - 精緻優化（P0 #17：動態尺寸） */}
            <Link href="/" className="flex items-center space-x-2 group" aria-label="ProWine 首頁">
              <motion.div
                animate={{
                  scale: scrolled ? 0.83 : 1,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <Logo variant="header" width={scrolled ? 100 : 120} height={scrolled ? 40 : 52} />
              </motion.div>
            </Link>

            {/* Desktop Navigation - 更精緻 */}
            <div className="hidden lg:flex items-center space-x-1">
              {menuItems.map((item) => (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => setIsMenuHovered(item.href)}
                  onMouseLeave={() => setIsMenuHovered(null)}
                >
                  <Link
                    href={item.href}
                    prefetch={true}
                    className="relative px-5 py-2 text-neutral-900 dark:text-neutral-50 hover:text-accent-gold dark:hover:text-accent-gold transition-all duration-300 font-serif font-light text-[15px] tracking-[0.05em] group cursor-pointer rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    onClick={(e) => {
                      // 確保點擊事件正常觸發
                      e.stopPropagation();
                    }}
                    aria-label={`前往${item.label}頁面`}
                  >
                    {item.label}
                    {/* Q4優化：多層次懸停效果 - 金色強調，統一淺色/深色模式 */}
                    {/* 背景色微調 - 金色背景 */}
                    <motion.div
                      initial={false}
                      animate={{
                        backgroundColor: isMenuHovered === item.href ? "rgba(212, 175, 55, 0.1)" : "transparent",
                      }}
                      className="absolute inset-0 rounded-md -z-10"
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                    {/* 底部金色線條 */}
                    <motion.span
                      initial={false}
                      animate={{
                        width: isMenuHovered === item.href ? "100%" : "0%",
                      }}
                      className="absolute bottom-0 left-0 h-[2px] bg-accent-gold"
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                    {/* 微妙的垂直移動 */}
                    <motion.span
                      initial={false}
                      animate={{
                        y: isMenuHovered === item.href ? -1 : 0,
                      }}
                      className="absolute inset-0 -z-10"
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </Link>
                </div>
              ))}
            </div>

            {/* Right Icons - 修復：所有按鈕都可點擊 */}
            <div className="flex items-center gap-2">
              {/* 搜尋 - P0 #20：搜索按鈕升級 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                {...createButtonProps(
                  () => handleSearch(),
                  {
                    className: "p-2 text-neutral-700 dark:text-neutral-200 hover:text-accent-gold dark:hover:text-accent-gold transition-all duration-300 rounded-full hover:bg-neutral-100/80 dark:hover:bg-neutral-700/50 cursor-pointer relative group",
                    "aria-label": "搜尋",
                    preventDefault: true,
                  }
                )}
                title="搜尋 (Ctrl+K)"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
                {/* Q5優化：發光效果 - 金色強調 */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-accent-gold/20 opacity-0 group-hover:opacity-100 blur-sm -z-10"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.button>

              {/* 願望清單 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                {...createButtonProps(
                  () => handleWishlist(),
                  {
                    className: "p-2 text-neutral-700 dark:text-neutral-200 hover:text-accent-gold dark:hover:text-accent-gold transition-colors relative rounded-full hover:bg-neutral-100/80 dark:hover:bg-neutral-700/50 cursor-pointer",
                    "aria-label": "願望清單",
                    preventDefault: true,
                  }
                )}
              >
                <Heart className="w-4 h-4" aria-hidden="true" />
                {/* Q6優化：深色模式適配 - 使用更亮的顏色變體 */}
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-burgundy dark:bg-accent-burgundy-light text-white text-[10px] rounded-full flex items-center justify-center font-medium shadow-md" aria-label={`${wishlistItems.length} 個願望清單項目`}>
                  {wishlistItems.length}
                </span>
              </motion.button>

              {/* 購物車 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                {...createButtonProps(
                  () => handleCart(),
                  {
                    className: "p-2 text-neutral-700 dark:text-neutral-200 hover:text-accent-gold dark:hover:text-accent-gold transition-colors relative rounded-full hover:bg-neutral-100/80 dark:hover:bg-neutral-700/50 cursor-pointer",
                    "aria-label": "購物車",
                    preventDefault: true,
                  }
                )}
              >
                <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-accent-gold dark:bg-accent-gold text-neutral-950 dark:text-neutral-950 text-[10px] rounded-full flex items-center justify-center font-semibold shadow-gold"
                    aria-label={`${cartCount} 個購物車項目`}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </motion.button>

              {/* 用戶 - Q5優化：深色模式圖標優化 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                {...createButtonProps(
                  () => handleUser(),
                  {
                    className: "p-2 text-neutral-700 dark:text-neutral-200 hover:text-accent-gold dark:hover:text-accent-gold transition-all duration-300 rounded-full hover:bg-neutral-100/80 dark:hover:bg-neutral-700/50 cursor-pointer relative group",
                    "aria-label": user ? "會員帳戶" : "登入",
                    preventDefault: true,
                  }
                )}
                title={user ? "會員帳戶" : "登入"}
              >
                {user ? (
                  // 已登錄：顯示用戶頭像（圓形，帶金色邊框）
                  <div className="relative w-6 h-6 rounded-full border-2 border-accent-gold overflow-hidden bg-gradient-to-br from-accent-gold/20 to-primary-600/20">
                    {user.name ? (
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-950 dark:text-neutral-50">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <User className="w-3.5 h-3.5 absolute inset-0 m-auto" />
                    )}
                  </div>
                ) : (
                  // 未登錄：顯示圖標
                  <>
                    <User className="w-4 h-4" />
                    <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 px-1.5 py-0.5 text-[9px] text-white dark:text-neutral-950 bg-neutral-900 dark:bg-accent-gold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      登入
                    </span>
                  </>
                )}
              </motion.button>

              {/* 主題切換 */}
              <div className="hidden md:block">
                <ThemeToggle />
              </div>

              {/* Mobile Menu Button */}
              <button
                {...createButtonProps(
                  () => setMobileMenuOpen(!mobileMenuOpen),
                  {
                    className: "lg:hidden p-2 text-neutral-700 dark:text-neutral-200 hover:text-accent-gold dark:hover:text-accent-gold transition-colors rounded-full hover:bg-neutral-100/80 dark:hover:bg-neutral-700/50 cursor-pointer min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                    "aria-label": mobileMenuOpen ? "關閉選單" : "開啟選單",
                    "aria-expanded": mobileMenuOpen,
                    "aria-controls": "mobile-menu",
                    preventDefault: true,
                  }
                )}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                id="mobile-menu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="lg:hidden overflow-hidden border-t border-neutral-200/50 dark:border-neutral-800/50"
                role="menu"
                aria-label="行動選單"
              >
                <div className="py-3 space-y-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      {...createLinkProps(
                        () => setMobileMenuOpen(false),
                        {
                          className: "block px-4 py-2.5 text-neutral-900 dark:text-neutral-50 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-accent-gold dark:hover:text-accent-gold transition-colors font-light text-sm min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded",
                          "aria-label": item.label,
                        }
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                  {/* 手機版深色模式切換 */}
                  <div className="px-4 py-3 border-t border-neutral-200/50 dark:border-neutral-800/50 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-900 dark:text-neutral-50 font-light">
                        主題切換
                      </span>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* 搜尋模態框 */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

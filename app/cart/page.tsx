"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Heart, MessageSquare, CheckSquare, Square, X, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/contexts/CartContext";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import CartPageSkeleton from "@/components/CartPageSkeleton";
import EmptyState from "@/components/EmptyState";
import { createButtonProps } from "@/lib/utils/button-props";
import { useToast } from "@/components/Toast";
import { logger } from "@/lib/utils/logger-production";

export default function CartPage() {
  const { items: cartItems, updateQuantity, removeItem, clearCart, total, isLoading } = useCart();
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const toast = useToast();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [showNoteInput, setShowNoteInput] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // 從 localStorage 載入備註和選擇狀態
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedNotes = localStorage.getItem("cart_item_notes");
        if (savedNotes) {
          setItemNotes(JSON.parse(savedNotes));
        }
        const savedSelection = localStorage.getItem("cart_selected_items");
        if (savedSelection) {
          setSelectedItems(new Set(JSON.parse(savedSelection)));
        }
      } catch (error) {
        logger.error("Failed to load cart preferences", error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, []);

  // 保存備註到 localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && Object.keys(itemNotes).length > 0) {
      try {
        localStorage.setItem("cart_item_notes", JSON.stringify(itemNotes));
      } catch (error) {
        logger.error("Failed to save cart notes", error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, [itemNotes]);

  // 保存選擇狀態到 localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && selectedItems.size > 0) {
      try {
        localStorage.setItem("cart_selected_items", JSON.stringify(Array.from(selectedItems)));
      } catch (error) {
        logger.error("Failed to save cart selection", error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, [selectedItems]);

  // 全選/取消全選
  const toggleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)));
    }
  };

  // 切換單個商品選擇
  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  // 批量刪除
  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) return;
    
    const confirmed = window.confirm(`確定要刪除選中的 ${selectedItems.size} 件商品嗎？`);
    if (!confirmed) return;

    try {
      for (const itemId of selectedItems) {
        const item = cartItems.find(i => i.id === itemId);
        if (item) {
          await removeItem(item.wineId);
        }
      }
      setSelectedItems(new Set());
      toast.success(`已刪除 ${selectedItems.size} 件商品`);
    } catch (error) {
      logger.error("Failed to batch delete items", error instanceof Error ? error : new Error(String(error)));
      toast.error("刪除失敗，請稍後再試");
    }
  };

  // 保存到願望清單
  const handleSaveToWishlist = async (item: typeof cartItems[0]) => {
    try {
      await addToWishlist({
        id: item.wineId,
        nameZh: item.nameZh,
        nameEn: item.nameEn,
        wineryName: item.wineryName,
        price: item.price,
        imageUrl: item.imageUrl,
        region: item.region,
      });
      toast.success("已加入願望清單");
    } catch (error) {
      logger.error("Failed to add to wishlist", error instanceof Error ? error : new Error(String(error)));
      toast.error("加入願望清單失敗");
    }
  };

  // 確認刪除
  const handleConfirmDelete = async (wineId: string) => {
    try {
      await removeItem(wineId);
      setShowDeleteConfirm(null);
      toast.success("已從購物車移除");
    } catch (error) {
      logger.error("Failed to remove item", error instanceof Error ? error : new Error(String(error)));
      toast.error("移除失敗，請稍後再試");
    }
  };

  // 保存備註
  const handleSaveNote = (itemId: string, note: string) => {
    setItemNotes({ ...itemNotes, [itemId]: note });
    setShowNoteInput(null);
    toast.info("備註已保存");
  };

  // 計算選中商品的總價
  const selectedTotal = cartItems
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (isLoading) {
    return <CartPageSkeleton />;
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-ivory">
      <div className="container-custom py-12">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-light text-neutral-900 mb-2">
            購物車
          </h1>
          <p className="text-neutral-600 font-light">
            {cartItems.length > 0
              ? `您有 ${cartItems.length} 件商品`
              : "您的購物車是空的"}
          </p>
        </div>

        {cartItems.length === 0 ? (
          <EmptyState
            variant="wine"
            title="購物車是空的"
            description="開始探索我們的臻選佳釀，將喜愛的葡萄酒加入詢價單"
            action={{
              label: "瀏覽酒款",
              href: "/wines",
            }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 購物車商品列表 */}
            <div className="lg:col-span-2 space-y-4">
              {/* 批量操作欄 */}
              {cartItems.length > 0 && (
                <div className="card-premium flex items-center justify-between p-4">
                  <button
                    {...createButtonProps(
                      toggleSelectAll,
                      {
                        className: "flex items-center gap-2 text-sm text-neutral-700 hover:text-primary-600 transition-colors min-h-[44px] md:min-h-[auto]",
                        preventDefault: true,
                      }
                    )}
                  >
                    {selectedItems.size === cartItems.length ? (
                      <CheckSquare className="w-5 h-5 text-primary-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                    <span>全選 ({selectedItems.size}/{cartItems.length})</span>
                  </button>
                  {selectedItems.size > 0 && (
                    <button
                      {...createButtonProps(
                        handleBatchDelete,
                        {
                          className: "px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] md:min-h-[auto]",
                          preventDefault: true,
                        }
                      )}
                    >
                      刪除選中 ({selectedItems.size})
                    </button>
                  )}
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      delay: index * 0.05, 
                      duration: 0.3,
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                    layout
                    className="card-premium group hover:shadow-lg transition-shadow duration-300"
                  >
                  <div className="flex gap-6">
                    {/* 選擇框 */}
                    <div className="flex items-start pt-2">
                      <button
                        {...createButtonProps(
                          () => toggleSelectItem(item.id),
                          {
                            className: "p-1 hover:bg-neutral-100 rounded transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto]",
                            preventDefault: true,
                          }
                        )}
                        aria-label={selectedItems.has(item.id) ? "取消選擇" : "選擇商品"}
                      >
                        {selectedItems.has(item.id) ? (
                          <CheckSquare className="w-5 h-5 text-primary-600" />
                        ) : (
                          <Square className="w-5 h-5 text-neutral-400" />
                        )}
                      </button>
                    </div>

                    {/* 商品圖片（可點擊放大） */}
                    <button
                      {...createButtonProps(
                        () => item.imageUrl && setExpandedImage(item.imageUrl),
                        {
                          className: "relative w-24 h-32 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 group/image hover:ring-2 hover:ring-primary-500 transition-all",
                          preventDefault: true,
                        }
                      )}
                      aria-label="查看大圖"
                    >
                      {item.imageUrl ? (
                        <>
                          <Image
                            src={item.imageUrl}
                            alt={item.nameZh}
                            fill
                            className="object-cover group-hover/image:scale-105 transition-transform duration-300"
                            sizes="96px"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center">
                            <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover/image:opacity-100 transition-opacity" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-neutral-300" />
                        </div>
                      )}
                    </button>

                    {/* 商品資訊 */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <Link
                            href={`/wines/${item.wineId}`}
                            className="block group/link"
                          >
                            <h3 className="text-lg font-medium text-neutral-900 mb-1 group-hover/link:text-primary-600 transition-colors">
                              {item.nameZh}
                            </h3>
                            <p className="text-sm text-neutral-500 mb-2">{item.nameEn}</p>
                            <p className="text-sm text-neutral-600">
                              {item.wineryName} · {item.region}
                            </p>
                          </Link>
                        </div>
                        <span className="text-lg font-medium text-primary-600 ml-4">
                          NT$ {(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>

                      {/* 備註功能 */}
                      <div className="mb-3">
                        {showNoteInput === item.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={itemNotes[item.id] || ""}
                              onChange={(e) => setItemNotes({ ...itemNotes, [item.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveNote(item.id, itemNotes[item.id] || "");
                                } else if (e.key === "Escape") {
                                  setShowNoteInput(null);
                                }
                              }}
                              placeholder="添加備註..."
                              className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] md:min-h-[auto]"
                              autoFocus
                            />
                            <button
                              {...createButtonProps(
                                () => handleSaveNote(item.id, itemNotes[item.id] || ""),
                                {
                                  className: "px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors min-h-[44px] md:min-h-[auto]",
                                  preventDefault: true,
                                }
                              )}
                            >
                              保存
                            </button>
                            <button
                              {...createButtonProps(
                                () => setShowNoteInput(null),
                                {
                                  className: "px-3 py-1.5 text-sm border border-neutral-300 rounded hover:bg-neutral-50 transition-colors min-h-[44px] md:min-h-[auto]",
                                  preventDefault: true,
                                }
                              )}
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {itemNotes[item.id] ? (
                              <p className="text-sm text-neutral-600 italic flex-1">
                                📝 {itemNotes[item.id]}
                              </p>
                            ) : null}
                            <button
                              {...createButtonProps(
                                () => setShowNoteInput(item.id),
                                {
                                  className: "text-xs text-neutral-500 hover:text-primary-600 flex items-center gap-1 transition-colors min-h-[44px] md:min-h-[auto]",
                                  preventDefault: true,
                                }
                              )}
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {itemNotes[item.id] ? "編輯備註" : "添加備註"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 數量控制和操作按鈕 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            {...createButtonProps(
                              () => updateQuantity(item.wineId, Math.max(1, item.quantity - 1)),
                              {
                                className: "p-2 hover:bg-neutral-100 rounded transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto]",
                                preventDefault: true,
                              }
                            )}
                            disabled={item.quantity <= 1}
                            aria-label="減少數量"
                          >
                            <Minus className="w-4 h-4 text-neutral-600" />
                          </motion.button>
                          <span className="w-12 text-center font-medium text-lg">{item.quantity}</span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            {...createButtonProps(
                              () => updateQuantity(item.wineId, item.quantity + 1),
                              {
                                className: "p-2 hover:bg-neutral-100 rounded transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto]",
                                preventDefault: true,
                              }
                            )}
                            aria-label="增加數量"
                          >
                            <Plus className="w-4 h-4 text-neutral-600" />
                          </motion.button>
                        </div>

                        <div className="flex items-center gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            {...createButtonProps(
                              () => handleSaveToWishlist(item),
                              {
                                className: `p-2 rounded transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] ${
                                  isInWishlist(item.wineId)
                                    ? "bg-primary-100 text-primary-600"
                                    : "hover:bg-neutral-100 text-neutral-600"
                                }`,
                                preventDefault: true,
                              }
                            )}
                            aria-label={isInWishlist(item.wineId) ? "已在願望清單" : "加入願望清單"}
                            title={isInWishlist(item.wineId) ? "已在願望清單" : "加入願望清單"}
                          >
                            <Heart className={`w-4 h-4 ${isInWishlist(item.wineId) ? "fill-current" : ""}`} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            {...createButtonProps(
                              () => setShowDeleteConfirm(item.wineId),
                              {
                                className: "p-2 hover:bg-red-50 text-red-600 rounded transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto]",
                                preventDefault: true,
                              }
                            )}
                            aria-label="刪除商品"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* 訂單摘要 */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card-premium sticky top-24"
              >
                <h2 className="text-xl font-serif font-light text-neutral-900 mb-6">
                  訂單摘要
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-neutral-600">
                    <span>小計</span>
                    <span>NT$ {total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>運費</span>
                    <span>待計算</span>
                  </div>
                  <div className="border-t border-neutral-200 pt-4 flex justify-between text-lg font-medium text-neutral-900">
                    <span>總計</span>
                    <span>NT$ {total.toLocaleString()}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full text-center px-6 py-3 bg-primary-600 text-white font-medium text-sm tracking-wider uppercase hover:bg-primary-700 transition-colors min-h-[44px] flex items-center justify-center"
                >
                  前往結帳
                </Link>

                <Link
                  href="/wines"
                  className="block w-full text-center mt-4 px-6 py-3 border border-neutral-300 text-neutral-700 font-medium text-sm hover:border-neutral-400 hover:bg-neutral-50 transition-colors min-h-[44px] flex items-center justify-center"
                >
                  繼續購物
                </Link>
              </motion.div>
            </div>
          </div>
        )}

        {/* 刪除確認對話框 */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteConfirm(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-serif font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                  確認刪除
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                  確定要從購物車中移除這件商品嗎？
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    {...createButtonProps(
                      () => setShowDeleteConfirm(null),
                      {
                        className: "px-4 py-2 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors min-h-[44px]",
                        preventDefault: true,
                      }
                    )}
                  >
                    取消
                  </button>
                  <button
                    {...createButtonProps(
                      () => showDeleteConfirm && handleConfirmDelete(showDeleteConfirm),
                      {
                        className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors min-h-[44px]",
                        preventDefault: true,
                      }
                    )}
                  >
                    確認刪除
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 圖片放大預覽 */}
        <AnimatePresence>
          {expandedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setExpandedImage(null)}
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative max-w-4xl max-h-[90vh] w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={expandedImage}
                  alt="商品大圖"
                  width={800}
                  height={1200}
                  className="w-full h-auto object-contain rounded-lg"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
                <button
                  {...createButtonProps(
                    () => setExpandedImage(null),
                    {
                      className: "absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors min-h-[44px] min-w-[44px]",
                      preventDefault: true,
                    }
                  )}
                  aria-label="關閉"
                >
                  <X className="w-5 h-5 text-neutral-900" />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


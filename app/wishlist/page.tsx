"use client";

import { Heart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import WineCard from "@/components/WineCard";
import { useWishlist } from "@/lib/contexts/WishlistContext";

export default function WishlistPage() {
  const { items: wishlistItems, isLoading } = useWishlist();

  return (
    <div className="min-h-screen pt-24 pb-20 bg-ivory">
      <div className="container-custom py-12">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-light text-neutral-900 mb-2">
            願望清單
          </h1>
          <p className="text-neutral-600 font-light">
            {wishlistItems.length > 0
              ? `您有 ${wishlistItems.length} 件收藏的酒款`
              : "收藏您喜愛的葡萄酒"}
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-neutral-500">載入中...</p>
          </div>
        ) : wishlistItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium text-center py-16"
          >
            <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-6" />
            <h2 className="text-2xl font-serif font-light text-neutral-900 mb-4">
              願望清單是空的
            </h2>
            <p className="text-neutral-600 font-light mb-8">
              開始探索我們的精選酒款，將喜愛的葡萄酒加入願望清單
            </p>
            <Link
              href="/wines"
              className="inline-flex items-center gap-2 px-6 py-3 border border-neutral-900 text-neutral-900 font-medium text-sm tracking-wider uppercase hover:bg-neutral-900 hover:text-white transition-all duration-300"
            >
              瀏覽酒款
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistItems.map((item, index) => (
              <motion.div
                key={item.wineId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <WineCard
                  id={item.wineId}
                  nameZh={item.nameZh}
                  nameEn={item.nameEn}
                  wineryName={item.wineryName}
                  price={item.price}
                  region={item.region}
                  imageUrl={item.imageUrl}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


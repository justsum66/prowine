'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState, useRef } from 'react'
import { Wine } from '@/types'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface WineCardProps {
  wine: Wine
  onWishlist?: (wineId: string) => void
  onInquiry?: (wineId: string) => void
}

/**
 * WineCard - 200萬等級精品感升級版
 * 風格：Apple + Dior/Chanel + 頂級酒莊融合
 * 特色：奢華感 + 金色點綴、智能動畫、響應式密度、動態色彩
 */
export function WineCard({ wine, onWishlist, onInquiry }: WineCardProps) {
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(wine.image_url || '/placeholder-wine.png')
  const cardRef = useRef<HTMLDivElement>(null)
  
  // 動態色彩系統（根據內容調整 - Q11: D）
  const getDynamicColor = () => {
    if (wine.is_limited) return 'dynamic-burgundy'
    if (wine.is_featured) return 'dynamic-gold'
    return 'dynamic-gold' // 默認金色
  }
  
  // 智能動畫選擇（根據內容 - Q9: D）
  const getAnimationType = () => {
    if (wine.is_featured) return 'premium' // 精選酒款使用更豐富的動畫
    if (wine.is_limited) return 'elegant' // 限量酒款使用優雅動畫
    return 'standard' // 標準動畫
  }
  
  const animationType = getAnimationType()
  
  // 響應式密度（根據螢幕尺寸 - Q13: D）
  const getResponsivePadding = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      if (width < 640) return 'p-4' // 手機：緊湊
      if (width < 1024) return 'p-5' // 平板：中等
      return 'p-6' // 桌面：寬鬆
    }
    return 'p-6' // 默認
  }

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true)
      setImageSrc('/placeholder-wine.png')
    }
  }

  return (
    <motion.div
      ref={cardRef}
      className={`group relative bg-white overflow-hidden ${getDynamicColor()}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ 
        duration: animationType === 'premium' ? 0.5 : 0.3, 
        ease: [0.19, 1, 0.22, 1] 
      }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.3, ease: [0.19, 1, 0.22, 1] }
      }}
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <Link href={`/wines/${wine.slug}`}>
        {/* Image Section - 3:4 比例，白色背景（Q4: A） */}
        <div className="relative aspect-[3/4] bg-white overflow-hidden">
          {/* 圖片容器 - Hover放大效果（Q10: B） */}
          <motion.div
            className="relative w-full h-full"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          >
            <Image
              src={imageSrc}
              alt={wine.name}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={handleImageError}
              unoptimized={imageSrc.startsWith('http://')}
              priority={wine.is_featured}
            />
          </motion.div>
          
          {/* Hover 金色邊框 - 精緻淡入效果（Q7: B - 奢華感 + 金色點綴） */}
          <motion.div
            className="absolute inset-0 border-2 border-transparent pointer-events-none"
            initial={{ borderColor: 'transparent' }}
            whileHover={{ 
              borderColor: 'var(--primary-gold)',
              transition: { duration: 0.3, ease: [0.19, 1, 0.22, 1] }
            }}
            style={{
              boxShadow: '0 0 0 2px transparent',
            }}
          />
          
          {/* 精緻陰影效果 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badges - 精緻設計，金色點綴 */}
          {wine.is_limited && (
            <motion.div
              className="absolute top-4 left-4 bg-primary-burgundy text-white px-3 py-1.5 text-xs font-semibold tracking-wide"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              style={{
                boxShadow: '0 2px 8px rgba(114, 47, 55, 0.3)',
              }}
            >
              限量
            </motion.div>
          )}
          {wine.is_featured && (
            <motion.div
              className="absolute top-4 right-4 bg-primary-gold text-primary-dark px-3 py-1.5 text-xs font-bold tracking-wider"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              style={{
                boxShadow: '0 2px 8px rgba(184, 134, 11, 0.3)',
              }}
            >
              精選
            </motion.div>
          )}
          
          {/* Wishlist Button - 精緻設計 */}
          <motion.button
            onClick={(e) => {
              e.preventDefault()
              onWishlist?.(wine.id)
            }}
            className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all touch-target z-10"
            aria-label="加入願望清單"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <Heart className="w-5 h-5 text-primary-burgundy" />
          </motion.button>
        </div>

        {/* Content Section - 響應式padding，40%留白（Q13: D） */}
        <div className={`${getResponsivePadding()} space-y-3`} style={{ 
          paddingTop: 'clamp(20px, 4vw, 24px)',
          paddingBottom: 'clamp(20px, 4vw, 24px)',
          paddingLeft: 'clamp(16px, 3vw, 24px)',
          paddingRight: 'clamp(16px, 3vw, 24px)',
        }}>
          {/* 酒莊名 - Playfair Display 14px, Weight 400, Color #666, Letter-spacing 0.5px (Q12: B) */}
          <motion.p
            className="font-serif text-sm font-normal text-secondary-grey-600"
            style={{ 
              letterSpacing: '0.5px',
              fontFamily: 'var(--font-playfair), var(--font-cormorant), serif',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {wine.winery?.name || 'Unknown Winery'}
          </motion.p>

          {/* 酒款名 - Playfair Display 22px, Weight 600, Color #1A1A1A, Line-height 1.3 (Q12: B) */}
          <motion.h3
            className="font-serif text-[22px] md:text-[24px] font-semibold text-primary-dark leading-snug"
            style={{
              fontFamily: 'var(--font-playfair), var(--font-cormorant), serif',
              lineHeight: '1.3',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {wine.name}
          </motion.h3>

          {/* 年份 - Inter 16px, Weight 500, Color #999 */}
          {wine.vintage && (
            <motion.p
              className="font-sans text-base font-medium text-secondary-grey-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {wine.vintage}
            </motion.p>
          )}

          {/* 品飲筆記 - Inter 14px, Weight 400, Color #666, Line-height 1.6, Max-lines 3 */}
          {wine.tasting_notes && (
            <motion.p
              className="font-sans text-sm font-normal text-secondary-grey-600 line-clamp-3 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              style={{
                lineHeight: '1.6',
              }}
            >
              {wine.tasting_notes}
            </motion.p>
          )}

          {/* Meta Info - 精緻設計 */}
          <motion.div
            className="flex flex-wrap gap-3 text-xs text-secondary-grey-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {wine.region && (
              <span className="px-2 py-1 bg-secondary-grey-100 rounded-sm">{wine.region}</span>
            )}
            {wine.varietal && (
              <span className="px-2 py-1 bg-secondary-grey-100 rounded-sm">{wine.varietal}</span>
            )}
            {wine.alcohol_content && (
              <span className="px-2 py-1 bg-secondary-grey-100 rounded-sm">{wine.alcohol_content}%</span>
            )}
          </motion.div>

          {/* Price & CTA - 金色點綴，精緻設計（Q7: B） */}
          <motion.div
            className="flex items-center justify-between pt-4 border-t border-secondary-grey-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <div>
              {/* 價格 - Playfair Display 28px Bold 金色（Q12: B, Q7: B） */}
              <p
                className="font-serif text-[28px] md:text-[32px] font-bold text-primary-gold"
                style={{
                  fontFamily: 'var(--font-playfair), var(--font-cormorant), serif',
                  textShadow: '0 1px 2px rgba(184, 134, 11, 0.1)',
                }}
              >
                {formatPrice(wine.price)}
              </p>
              {wine.original_price && wine.original_price > wine.price && (
                <p className="font-sans text-sm text-secondary-grey-400 line-through mt-1">
                  {formatPrice(wine.original_price)}
                </p>
              )}
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                onInquiry?.(wine.id)
              }}
              className="touch-target hover:bg-primary-gold transition-all duration-300"
              style={{ 
                padding: '12px 32px', 
                borderRadius: '0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              詢價
            </Button>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  )
}


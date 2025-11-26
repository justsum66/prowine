'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'
import { Award, Grape, Sparkles } from 'lucide-react'
import { Winery } from '@/types'
import { Button } from '@/components/ui/Button'

interface WineryCardProps {
  winery: Winery
  featured?: boolean
}

export function WineryCard({ winery, featured = false }: WineryCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [0, 50])
  
  const [heroImageError, setHeroImageError] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const heroImageSrc = heroImageError ? '/placeholder-winery.jpg' : (winery.hero_image_url || '/placeholder-winery.jpg')
  const logoSrc = logoError ? null : winery.logo_url

  const handleHeroImageError = () => {
    if (!heroImageError) {
      setHeroImageError(true)
    }
  }

  const handleLogoError = () => {
    if (!logoError) {
      setLogoError(true)
    }
  }

  return (
    <motion.div
      ref={ref}
      className={`group relative overflow-hidden bg-white ${
        featured ? 'md:col-span-2' : ''
      }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
    >
      {/* Hero Image - 21:9 比例 */}
      <div className="relative aspect-[21/9] overflow-hidden">
        <motion.div style={{ y }} className="h-full w-full">
          <Image
            src={heroImageSrc}
            alt={winery.name}
            fill
            className="object-cover scale-110 group-hover:scale-100 transition-transform duration-700 ease-out-expo"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 66vw"
            onError={handleHeroImageError}
            unoptimized={heroImageSrc.startsWith('http://')}
          />
        </motion.div>

        {/* 漸層遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

        {/* Logo 置中 - 優化版：SVG優先, 白色或金色, 尺寸120px height，Parallax增強 */}
        {logoSrc && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
          >
            <motion.div
              className="relative w-[120px] h-[120px] drop-shadow-2xl"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <Image
                src={logoSrc}
                alt={`${winery.name} Logo`}
                fill
                className="object-contain filter brightness-0 invert"
                onError={handleLogoError}
                unoptimized={logoSrc.startsWith('http://')}
              />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Content Section - 按照規範: padding 32px */}
      <div className="p-8 space-y-6" style={{ padding: '32px' }}>
        {/* 酒莊名 - Playfair Display 32px Bold 置中（Q12: B） */}
        <motion.h2
          className="font-display text-[32px] md:text-[36px] font-bold text-primary-dark text-center"
          style={{
            fontFamily: 'var(--font-playfair), var(--font-cormorant), serif',
          }}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {winery.name}
        </motion.h2>

        {/* 建立年份 - Sans-serif 14px Color #999 置中 Letter-spacing 2px */}
        {winery.established && (
          <p className="font-sans text-sm font-normal text-secondary-grey-400 text-center" style={{ letterSpacing: '2px' }}>
            EST. {winery.established}
          </p>
        )}

        {/* 故事摘要 - Serif 16px 4行 置中 Max-width 600px Line-height 1.8 */}
        {winery.description && (
          <p className="font-serif text-base font-normal text-secondary-grey-800 text-center max-w-[600px] mx-auto leading-loose line-clamp-4" style={{ margin: '24px auto' }}>
            {winery.description}
          </p>
        )}

        {/* Highlights Grid - 按照規範: grid columns="3" gap="16px" */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-secondary-grey-200" style={{ gap: '16px' }}>
          <div className="text-center">
            <Award className="w-6 h-6 mx-auto mb-2 text-primary-gold" />
            <p className="font-sans text-xs text-secondary-grey-400 mb-1">
              得獎記錄
            </p>
            <p className="font-serif text-xl font-semibold text-primary-dark">
              {winery.awards_count || 0}
            </p>
          </div>
          <div className="text-center">
            <Grape className="w-6 h-6 mx-auto mb-2 text-primary-gold" />
            <p className="font-sans text-xs text-secondary-grey-400 mb-1">
              種植面積
            </p>
            <p className="font-serif text-xl font-semibold text-primary-dark">
              {winery.acreage ? `${winery.acreage} 公頃` : '-'}
            </p>
          </div>
          <div className="text-center">
            <Sparkles className="w-6 h-6 mx-auto mb-2 text-primary-gold" />
            <p className="font-sans text-xs text-secondary-grey-400 mb-1">
              產區
            </p>
            <p className="font-serif text-xl font-semibold text-primary-dark">
              {winery.region}
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="flex gap-4 justify-center pt-4">
          <Button variant="default" asChild>
            <Link href={`/wineries/${winery.slug}`}>探索酒款</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/wineries/${winery.slug}#story`}>了解故事</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}


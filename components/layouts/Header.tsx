'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Search } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'

/**
 * Header - 升級版：精緻導航設計、流暢hover、移動端優化、金色點綴
 * 風格：200萬等級精品感
 */
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <motion.header
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-secondary-grey-200"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo - 精緻設計 */}
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div
              className="relative h-12 w-auto flex items-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src="/logo.png"
                alt="ProWine Logo"
                width={120}
                height={48}
                className="object-contain"
                priority
              />
            </motion.div>
            <motion.span
              className="font-display text-xl font-bold text-primary-dark hidden sm:inline"
              style={{
                fontFamily: 'var(--font-playfair), var(--font-cormorant), serif',
              }}
              whileHover={{ color: 'var(--primary-gold)' }}
              transition={{ duration: 0.2 }}
            >
              酩陽實業
            </motion.span>
          </Link>

          {/* Desktop Navigation - 精緻設計，流暢hover，金色點綴 */}
          <nav className="hidden md:flex items-center space-x-8">
            {[
              { href: '/wines', label: '酒款' },
              { href: '/wineries', label: '酒莊' },
              { href: '/blog', label: '品酩知識' },
              { href: '/about', label: '關於我們' },
              { href: '/contact', label: '聯絡我們' },
            ].map((item) => (
              <motion.div key={item.href} whileHover={{ y: -2 }}>
                <Link
                  href={item.href}
                  className="font-sans text-sm font-medium text-primary-dark hover:text-primary-gold transition-colors duration-300 relative group"
                >
                  {item.label}
                  {/* 金色下劃線hover效果 */}
                  <motion.span
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-gold"
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                  />
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Actions - 精緻設計，金色點綴 */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <motion.button
              className="p-2 hover:bg-primary-cream rounded-full transition-colors touch-target"
              aria-label="搜尋"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-5 h-5 text-primary-dark group-hover:text-primary-gold transition-colors" />
            </motion.button>
            <Button
              variant="outline"
              size="sm"
              href="/contact"
              className="hidden md:inline-flex hover:bg-primary-gold hover:border-primary-gold transition-all duration-300"
            >
              詢價
            </Button>
            <motion.button
              className="md:hidden p-2 touch-target"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="選單"
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6 text-primary-dark" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6 text-primary-dark" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu - 流暢動畫，移動端優化 */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.nav
              className="md:hidden py-4 border-t border-secondary-grey-200"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            >
              <div className="flex flex-col space-y-4">
                {[
                  { href: '/wines', label: '酒款' },
                  { href: '/wineries', label: '酒莊' },
                  { href: '/blog', label: '品酩知識' },
                  { href: '/about', label: '關於我們' },
                  { href: '/contact', label: '聯絡我們' },
                ].map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className="font-sans text-base font-medium text-primary-dark hover:text-primary-gold transition-colors duration-300 block py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  )
}


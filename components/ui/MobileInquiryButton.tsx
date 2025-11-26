'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X } from 'lucide-react'
import { InquiryForm } from '@/components/inquiry/InquiryForm'

interface MobileInquiryButtonProps {
  wineIds?: string[]
  inquiryType?: 'product' | 'bulk' | 'general'
}

export function MobileInquiryButton({ wineIds = [], inquiryType = 'product' }: MobileInquiryButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Fixed Button */}
      <motion.button
        className="fixed bottom-24 right-4 z-40 md:hidden w-14 h-14 bg-primary-burgundy text-white rounded-full shadow-lg flex items-center justify-center"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="詢價"
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="sticky top-0 bg-white border-b border-secondary-grey-200 p-4 flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold text-primary-dark">商品詢價</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-primary-cream rounded-full transition-colors"
                  aria-label="關閉"
                >
                  <X className="w-5 h-5 text-primary-dark" />
                </button>
              </div>
              <div className="p-4">
                <InquiryForm wineIds={wineIds} inquiryType={inquiryType} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}


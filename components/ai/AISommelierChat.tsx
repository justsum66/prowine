'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { WineCard } from '@/components/cards/WineCard'
import { Wine } from '@/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  wines?: Wine[]
}

export function AISommelierChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '您好！我是ProWine的AI侍酒師。我可以根據您的口味、場合和預算，為您推薦最適合的葡萄酒。',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      })

      const data = await response.json()

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          wines: data.recommendations,
        },
      ])
    } catch (error) {
      console.error('Error chatting with AI:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '抱歉，發生錯誤。請稍後再試。',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Chat Bubble - 手機版調整位置 */}
      <motion.button
        className="fixed bottom-24 md:bottom-8 right-4 w-14 h-14 bg-primary-burgundy text-white rounded-full shadow-lg flex items-center justify-center z-40 hover:bg-primary-gold transition-colors touch-target"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="開啟AI侍酒師"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-16 md:bottom-8 right-4 w-[calc(100vw-2rem)] md:w-[420px] h-[calc(100vh-8rem)] md:h-[680px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-secondary-grey-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-burgundy rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-primary-dark">
                    AI 侍酒師
                  </h3>
                  <p className="font-sans text-xs text-secondary-grey-400">
                    線上為您服務
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-primary-cream rounded-full transition-colors touch-target"
                aria-label="關閉"
              >
                <X className="w-5 h-5 text-primary-dark" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 swipeable no-bounce">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 md:p-4 ${
                      message.role === 'user'
                        ? 'bg-primary-dark text-white'
                        : 'bg-primary-cream text-primary-dark'
                    }`}
                  >
                    <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    {message.wines && message.wines.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {message.wines.map((wine) => (
                          <WineCard key={wine.id} wine={wine} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-primary-cream rounded-lg p-4">
                    <Loader2 className="w-5 h-5 text-primary-burgundy animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-secondary-grey-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="描述您想要的葡萄酒..."
                  className="flex-1 px-4 py-3 border-2 border-secondary-grey-200 focus:border-primary-burgundy focus:outline-none transition-colors text-base"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="touch-target"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

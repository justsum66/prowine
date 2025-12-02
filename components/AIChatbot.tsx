"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Bot, User, GripVertical } from "lucide-react";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  "如何詢價？",
  "運送方式有哪些？",
  "退換貨政策？",
  "如何選擇適合的葡萄酒？",
  "聯絡客服",
];

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "您好！我是 ProWine 的 AI 侍酒師，很高興為您服務。我可以協助您：\n\n• 推薦適合的葡萄酒\n• 解答品酒相關問題\n• 協助詢價與訂購\n• 提供酒莊資訊\n\n請告訴我您需要什麼協助？",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 可拖動按鈕位置狀態
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // 從 localStorage 恢復位置
  useEffect(() => {
    const savedPosition = localStorage.getItem("ai-chatbot-button-position");
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setButtonPosition({ x, y });
      } catch (error) {
        logger.error("Failed to load button position", error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, []);
  
  // 保存位置到 localStorage
  const savePosition = useCallback((x: number, y: number) => {
    try {
      localStorage.setItem("ai-chatbot-button-position", JSON.stringify({ x, y }));
    } catch (error) {
      logger.error("Failed to save button position", error instanceof Error ? error : new Error(String(error)));
    }
  }, []);
  
  // 處理拖動開始
  const handleDragStart = useCallback((e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    if (isOpen) return; // 如果對話框打開，不允許拖動
    
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    dragStartPos.current = {
      x: clientX - buttonPosition.x,
      y: clientY - buttonPosition.y,
    };
  }, [isOpen, buttonPosition]);
  
  // 處理拖動中
  const handleDrag = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || isOpen || typeof window === "undefined") return;
    
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - dragStartPos.current.x;
    const newY = clientY - dragStartPos.current.y;
    
    // 限制在視窗範圍內
    const maxX = window.innerWidth - 64; // 按鈕寬度
    const maxY = window.innerHeight - 64; // 按鈕高度
    
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));
    
    setButtonPosition({ x: constrainedX, y: constrainedY });
  }, [isDragging, isOpen]);
  
  // 處理拖動結束
  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    savePosition(buttonPosition.x, buttonPosition.y);
  }, [isDragging, buttonPosition, savePosition]);
  
  // 監聽拖動事件
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("touchmove", handleDrag);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchend", handleDragEnd);
      
      return () => {
        window.removeEventListener("mousemove", handleDrag);
        window.removeEventListener("touchmove", handleDrag);
        window.removeEventListener("mouseup", handleDragEnd);
        window.removeEventListener("touchend", handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!messageText) setInput("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      // 構建對話歷史（僅最近 10 條消息，排除初始歡迎訊息）
      const recentHistory = messages
        .filter((msg) => msg.id !== "1") // 排除初始歡迎訊息
        .slice(-10)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // 添加超時控制（25秒，給服務器20秒 + 緩衝）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: recentHistory,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 檢查響應是否為空
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        // Q22優化：使用logger替代console.error
        logger.error("API 響應不是 JSON", new Error("Invalid content type"), {
          status: response.status,
          statusText: response.statusText,
          contentType,
          text: text.substring(0, 200),
        });
        throw new Error(`伺服器響應格式錯誤 (${response.status})`);
      }

      const data = await response.json().catch((err) => {
        // Q22優化：使用logger替代console.error
        logger.error("JSON 解析失敗", err as Error);
        return { error: "響應解析失敗", message: "伺服器響應無法解析，請稍後再試。" };
      });

      if (!response.ok) {
        // Q22優化：使用logger替代console.error
        logger.error("API Error Response", new Error(`HTTP ${response.status}`), {
          status: response.status,
          statusText: response.statusText,
          data: data,
        });
        throw new Error(data.error || data.message || `HTTP ${response.status}: AI 服務錯誤`);
      }

      // 檢查響應數據是否有效
      if (!data || typeof data !== "object") {
        // Q22優化：使用logger替代console.error
        logger.error("無效的響應數據", new Error("Invalid response data"), { data });
        throw new Error("伺服器返回了無效的響應數據");
      }

      setIsTyping(false);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message || data.content || "抱歉，無法處理您的問題。請聯繫客服。",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: unknown) {
      // Q22優化：使用logger替代console.error
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("Error sending message", errorObj);
      logger.error("Error details", errorObj, {
        message: errorObj.message,
        stack: errorObj.stack,
        name: errorObj.name,
      });
      setIsTyping(false);
      
      // 顯示更詳細的錯誤訊息
      let errorContent = "抱歉，AI 侍酒師暫時無法回應。";
      
      // 處理超時錯誤
      if (errorObj.name === "AbortError" || errorObj.message?.includes("timeout") || errorObj.message?.includes("Timeout")) {
        errorContent = "AI 服務響應超時，請稍後再試。\n\n如需立即協助，請聯繫客服：\n📱 LINE@：@415znht\n📞 電話：02-27329490";
      } else if (errorObj.message?.includes("API Key") || errorObj.message?.includes("配置") || errorObj.message?.includes("環境變數")) {
        errorContent = "AI 服務配置錯誤，請聯繫管理員檢查環境變數設置。";
      } else if (errorObj.message?.includes("401") || errorObj.message?.includes("403")) {
        errorContent = "AI 服務認證失敗，請聯繫管理員檢查 API Key。";
      } else if (errorObj.message?.includes("500") || errorObj.message?.includes("500")) {
        errorContent = "伺服器暫時無法處理請求，請稍後再試。\n\n如需立即協助，請聯繫客服：\n📱 LINE@：@415znht\n📞 電話：02-27329490";
      } else if (errorObj.message) {
        // 開發環境顯示詳細錯誤
        if (process.env.NODE_ENV === "development") {
          errorContent = `抱歉，發生錯誤：${errorObj.message}\n\n請聯繫客服：\n📱 LINE@：@415znht\n📞 電話：02-27329490`;
        } else {
          errorContent = "抱歉，AI 侍酒師暫時無法回應。請聯繫我們的客服團隊：\n\n📱 LINE@：@415znht\n📞 電話：02-27329490\n📧 Email：service@prowine.com.tw";
        }
      } else {
        errorContent = "抱歉，AI 侍酒師暫時無法回應。請聯繫我們的客服團隊：\n\n📱 LINE@：@415znht\n📞 電話：02-27329490\n📧 Email：service@prowine.com.tw";
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLineTransfer = () => {
    window.open("https://line.me/R/ti/p/@415znht", "_blank");
  };

  return (
    <>
      {/* Chat Button - 可拖動 */}
      <motion.button
        ref={buttonRef}
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          x: buttonPosition.x,
          y: buttonPosition.y,
        }}
        whileHover={{ scale: isDragging ? 1 : 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          // 如果正在拖動，不觸發點擊
          if (isDragging) {
            e.preventDefault();
            return;
          }
          setIsOpen(true);
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{
          position: "fixed",
          bottom: buttonPosition.y === 0 ? "2rem" : "auto",
          right: buttonPosition.x === 0 ? "2rem" : "auto",
          left: buttonPosition.x !== 0 ? `${buttonPosition.x}px` : "auto",
          top: buttonPosition.y !== 0 ? `${buttonPosition.y}px` : "auto",
          cursor: isDragging ? "grabbing" : "grab",
          touchAction: "none",
        }}
        className="w-16 h-16 bg-primary-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:bg-primary-700 transition-colors group min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:cursor-grabbing"
        aria-label="開啟 AI 客服（可拖動）"
        aria-expanded={isOpen}
        aria-controls="ai-chatbot-window"
      >
        <div className="relative flex items-center justify-center">
          <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" aria-hidden="true" />
          {!isOpen && (
            <>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-gold rounded-full animate-pulse" aria-hidden="true"></span>
              {/* 拖動指示器 */}
              <GripVertical className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-4 h-4 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            </>
          )}
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            id="ai-chatbot-window"
            role="dialog"
            aria-modal="true"
            aria-label="AI 侍酒師對話視窗"
            style={{
              position: "fixed",
              bottom: buttonPosition.y === 0 ? "6rem" : undefined,
              top: buttonPosition.y !== 0 ? `${Math.max(16, typeof window !== "undefined" ? window.innerHeight - buttonPosition.y - 700 : 600)}px` : undefined,
              right: buttonPosition.x === 0 ? "0.5rem" : `${Math.max(8, typeof window !== "undefined" ? window.innerWidth - buttonPosition.x - 400 : 400)}px`,
            }}
            className="w-[calc(100vw-1rem)] md:w-96 h-[600px] max-h-[calc(100vh-8rem)] bg-white rounded-lg shadow-2xl z-50 flex flex-col border border-neutral-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">AI 侍酒師</h3>
                  <p className="text-xs text-primary-100">24/7 為您服務</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="關閉對話視窗"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-primary-600 text-white"
                        : "bg-white text-neutral-900 border border-neutral-200 shadow-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString("zh-TW", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-neutral-600" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* 正在輸入動畫 */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-neutral-200 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              {isLoading && !isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-neutral-200">
                    <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 pt-2 pb-2 border-t border-neutral-200 bg-white">
                <p className="text-xs text-neutral-500 mb-2">常見問題：</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(question)}
                      className="px-3 py-1.5 text-xs bg-neutral-100 hover:bg-primary-100 text-neutral-700 hover:text-primary-600 rounded-full transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-neutral-200 bg-white">
              <div className="flex gap-2 mb-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="輸入您的問題..."
                  className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px] md:min-h-[auto]"
                  aria-label="發送訊息"
                  aria-disabled={!input.trim() || isLoading}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-neutral-500">
                  或聯繫 LINE@：<span className="font-medium">@415znht</span>
                </p>
                <button
                  onClick={handleLineTransfer}
                  className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1 min-h-[44px] md:min-h-[auto]"
                  aria-label="轉接到LINE客服"
                >
                  轉接 LINE
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

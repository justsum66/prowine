"use client";

import { useState, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Search, ThumbsUp, ThumbsDown, Tag, Video, Image as ImageIcon } from "lucide-react";
import FAQPageSkeleton from "@/components/FAQPageSkeleton";

interface FAQ {
  id: string;
  q: string;
  a: string;
  category: string;
  tags: string[];
  helpful: number;
  notHelpful: number;
  hasVideo?: boolean;
  hasImage?: boolean;
}

const faqs: FAQ[] = [
  {
    id: "1",
    category: "詢價與訂購",
    q: "如何詢價？",
    a: "您可以透過以下方式詢價：\n1. 在商品頁面點擊「詢價」按鈕\n2. 填寫詢價表單，我們會在 24 小時內回覆\n3. 透過 LINE@ (@415znht) 直接聯繫\n4. 撥打客服專線：02-27329490",
    tags: ["詢價", "訂購", "聯繫方式"],
    helpful: 45,
    notHelpful: 2,
  },
  {
    id: "2",
    category: "詢價與訂購",
    q: "詢價後多久會收到回覆？",
    a: "我們會在收到您的詢價後 24 小時內回覆。如遇週末或國定假日，將順延至下一個工作日。",
    tags: ["詢價", "回覆時間"],
    helpful: 38,
    notHelpful: 1,
  },
  {
    id: "3",
    category: "運送與配送",
    q: "運送方式有哪些？",
    a: "我們提供以下運送方式：\n1. **宅配到府**：全台本島免運（滿額優惠）\n2. **超商取貨**：7-11、全家、萊爾富、OK便利商店\n3. **門市自取**：台北、台中、高雄門市\n\n詳細資訊請參考「運送資訊」頁面。",
    tags: ["運送", "配送", "取貨"],
    helpful: 52,
    notHelpful: 3,
    hasVideo: true,
  },
  {
    id: "4",
    category: "退換貨",
    q: "退換貨政策是什麼？",
    a: "我們提供完善的退換貨服務：\n• 收到商品後 7 天內可申請退換貨\n• 商品需保持原包裝完整，未開封\n• 運費由我們負擔\n\n詳細政策請參考「退換貨政策」頁面。",
    tags: ["退換貨", "政策"],
    helpful: 67,
    notHelpful: 5,
    hasImage: true,
  },
];

const categories = ["全部", "詢價與訂購", "運送與配送", "退換貨", "產品相關"];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [helpfulRatings, setHelpfulRatings] = useState<Record<string, "up" | "down" | null>>({});
  const [isLoading, setIsLoading] = useState(false);

  const filteredFAQs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesSearch =
        !searchQuery ||
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "全部" || faq.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleHelpful = (faqId: string, type: "up" | "down") => {
    if (helpfulRatings[faqId] === type) {
      setHelpfulRatings({ ...helpfulRatings, [faqId]: null });
    } else {
      setHelpfulRatings({ ...helpfulRatings, [faqId]: type });
    }
  };

  if (isLoading) {
    return <FAQPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <section className="bg-white border-b border-neutral-200">
        <div className="container-custom py-16">
          <div className="flex items-center gap-4 mb-4">
            <HelpCircle className="w-12 h-12 text-primary-600" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900">
              常見問題
            </h1>
          </div>
          <p className="text-lg text-neutral-600">
            找不到答案？聯繫我們的客服團隊
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="bg-white border-b border-neutral-200 sticky top-20 z-30">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* 搜尋框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋問題、標籤..."
                className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[44px] md:min-h-[auto]"
                aria-label="搜尋常見問題"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    // 可以添加搜索功能
                  }
                }}
              />
            </div>
          </div>

          {/* 分類標籤 */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="問題分類">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  selectedCategory === category
                    ? "bg-primary-600 text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
                role="tab"
                aria-selected={selectedCategory === category}
                aria-controls={`faq-category-${category}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="container-custom py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {filteredFAQs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-neutral-600 text-lg">找不到相關問題</p>
            </div>
          ) : (
            filteredFAQs.map((faq) => {
              const isOpen = openIndex === faq.id;
              const rating = helpfulRatings[faq.id];

              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : faq.id)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    aria-label={`${isOpen ? "關閉" : "展開"}問題：${faq.q}`}
                  >
                    <div className="flex-1 pr-4">
                      <div className="font-semibold text-neutral-900 mb-2" id={`faq-question-${faq.id}`}>
                        {faq.q}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded">
                          {faq.category}
                        </span>
                        {faq.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded flex items-center gap-1"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                        {faq.hasVideo && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                            <Video className="w-3 h-3" />
                            影片
                          </span>
                        )}
                        {faq.hasImage && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            圖片
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-neutral-400 flex-shrink-0 transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                        id={`faq-answer-${faq.id}`}
                        role="region"
                        aria-labelledby={`faq-question-${faq.id}`}
                      >
                        <div className="px-6 py-4 border-t border-neutral-200">
                          <div className="text-neutral-600 leading-relaxed whitespace-pre-line mb-4">
                            {faq.a}
                          </div>

                          {/* 有用性評分 */}
                          <div className="flex items-center gap-4 pt-4 border-t border-neutral-100">
                            <span className="text-sm text-neutral-500">這個回答有幫助嗎？</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleHelpful(faq.id, "up")}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                  rating === "up"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-neutral-100 text-neutral-600 hover:bg-green-50"
                                }`}
                                aria-label={`標記為有幫助（目前${faq.helpful + (rating === "up" ? 1 : 0)}個）`}
                                aria-pressed={rating === "up"}
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span>{faq.helpful + (rating === "up" ? 1 : 0)}</span>
                              </button>
                              <button
                                onClick={() => handleHelpful(faq.id, "down")}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                                  rating === "down"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-neutral-100 text-neutral-600 hover:bg-red-50"
                                }`}
                                aria-label={`標記為無幫助（目前${faq.notHelpful + (rating === "down" ? 1 : 0)}個）`}
                                aria-pressed={rating === "down"}
                              >
                                <ThumbsDown className="w-4 h-4" />
                                <span>{faq.notHelpful + (rating === "down" ? 1 : 0)}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Contact CTA */}
        <div className="max-w-4xl mx-auto mt-12 bg-primary-50 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-serif font-semibold text-neutral-900 mb-4">
            還有其他問題？
          </h3>
          <p className="text-neutral-600 mb-6">
            聯繫我們的客服團隊，我們很樂意為您解答
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://line.me/R/ti/p/@415znht"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center"
              aria-label="加入LINE客服（將在新視窗開啟）"
            >
              加入 LINE@
            </a>
            <a
              href="/contact"
              className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-colors font-medium min-h-[44px] md:min-h-[auto] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center"
              aria-label="前往聯絡我們頁面"
            >
              聯絡我們
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

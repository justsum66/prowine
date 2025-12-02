"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Share2, Facebook, Twitter, Link as LinkIcon } from "lucide-react";
import Image from "next/image";
import VideoSection from "@/components/VideoSection";
import { optimizeImageUrl } from "@/lib/utils/image-optimization";
import { logger } from "@/lib/utils/logger-production";

interface Chapter {
  id: string;
  title: string;
  content: string;
  image?: string;
  video?: string;
}

export default function BrandStoryPage() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  const [copied, setCopied] = useState(false);
  const [optimizedHeroImage, setOptimizedHeroImage] = useState<string | null>(null);
  const [optimizedChapterImages, setOptimizedChapterImages] = useState<Record<string, string>>({});

  const chapters: Chapter[] = [
    {
      id: "origin",
      title: "起源",
      content:
        "ProWine 酩陽實業成立於 2015 年，由一群熱愛葡萄酒的專業人士共同創立。我們從一個簡單的夢想開始：將世界頂級精品葡萄酒帶入台灣市場，讓每一位愛酒人士都能品嚐到來自世界各地的優質佳釀。九年來，我們走訪了法國、義大利、西班牙、澳洲等主要產區，與超過 30 家頂級酒莊建立深度合作關係，每一瓶酒都經過嚴格篩選，確保品質與來源的可靠性。",
      image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1920&q=90&auto=format&fit=crop",
    },
    {
      id: "mission",
      title: "使命",
      content:
        "我們的使命是成為台灣最專業、最值得信賴的葡萄酒進口商。我們不僅提供優質產品，更致力於推廣葡萄酒文化與知識。透過專業的侍酒師團隊、豐富的品酒活動，以及 AI 智能推薦系統，我們希望讓更多人了解葡萄酒的奧妙，體驗品飲的樂趣。我們相信，每一瓶葡萄酒都承載著獨特的風土故事、釀酒師的匠心，以及酒莊的歷史傳承，值得被細細品味與珍藏。",
      image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=1920&q=90&auto=format&fit=crop",
    },
    {
      id: "values",
      title: "價值觀",
      content:
        "專業、誠信、創新是我們的核心價值。專業，體現在我們對每一瓶酒的嚴格把關，從產區選擇、酒莊合作到品質檢驗，每個環節都追求卓越。誠信，是我們與客戶、合作夥伴建立長期信任的基礎，我們承諾提供真實、透明的產品資訊與服務。創新，則是我們持續前進的動力，無論是引進新興產區的優質酒款，還是運用 AI 技術提供個人化推薦，我們始終走在行業前沿，為台灣葡萄酒市場帶來更多可能性。",
      image: "https://images.unsplash.com/photo-1506377247727-4b5c465f6e3a?w=1920&q=90&auto=format&fit=crop",
    },
    {
      id: "future",
      title: "未來",
      content:
        "展望未來，ProWine 將持續深耕台灣葡萄酒市場，引進更多來自新興產區的優質酒款，並擴大與頂級酒莊的合作關係。我們將進一步完善 AI 侍酒師服務，透過大數據分析與機器學習，為每位客戶提供更精準、更個人化的推薦與諮詢。同時，我們也將舉辦更多品酒活動、葡萄酒教育課程，推廣葡萄酒文化，讓更多人愛上這門優雅的藝術。我們相信，透過持續的創新與努力，ProWine 將成為台灣葡萄酒市場的領導品牌，為每一位愛酒人士帶來最美好的品飲體驗。",
      image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1920&q=90&auto=format&fit=crop",
    },
  ];

  const handleShare = async (platform?: string) => {
    const shareData = {
      title: "ProWine 品牌故事",
      text: "探索 ProWine 的傳奇歷程",
      url: window.location.href,
    };

    try {
      if (platform === "facebook") {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
          "_blank"
        );
      } else if (platform === "twitter") {
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareData.text)}`,
          "_blank"
        );
      } else if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      logger.error(
        "Share failed",
        error instanceof Error ? error : new Error(String(error)),
        { component: "BrandStoryPage" }
      );
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Parallax */}
      <section className="relative h-screen overflow-hidden">
        <motion.div
          style={{ opacity, scale }}
          className="absolute inset-0"
        >
          <Image
            src={optimizedHeroImage || "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1920&q=90&auto=format&fit=crop"}
            alt="ProWine 品牌故事 - 精選葡萄酒"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80" />
        </motion.div>

        <div className="relative z-10 h-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-center text-white px-8"
          >
            <h1 className="text-6xl md:text-8xl font-serif font-bold mb-6">
              ProWine
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
              每一瓶都訴說著獨特的風土故事
            </p>
          </motion.div>
        </div>

        {/* 章節導航 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div className="flex gap-4">
            {chapters.map((chapter, index) => (
              <a
                key={chapter.id}
                href={`#${chapter.id}`}
                className="w-2 h-2 rounded-full bg-white/60 hover:bg-white transition-colors"
                aria-label={chapter.title}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 章節內容 */}
      {chapters.map((chapter, index) => (
        <section
          key={chapter.id}
          id={chapter.id}
          className={`min-h-screen flex items-center ${
            index % 2 === 0 ? "bg-white" : "bg-neutral-50"
          }`}
        >
          <div className="container-custom py-24">
            <div
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? "lg:grid-flow-dense" : ""
              }`}
            >
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className={index % 2 === 1 ? "lg:col-start-2" : ""}
              >
                {chapter.image && (
                  <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl">
                    <Image
                      src={optimizedChapterImages[chapter.id] || chapter.image}
                      alt={chapter.title}
                      fill
                      className="object-cover"
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      quality={85}
                    />
                  </div>
                )}
                {chapter.video && (
                  <VideoSection
                    src={chapter.video}
                    poster={chapter.image}
                    title={chapter.title}
                    className="rounded-lg overflow-hidden shadow-2xl"
                  />
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={index % 2 === 1 ? "lg:col-start-1" : ""}
              >
                <h2 className="text-4xl md:text-5xl font-serif font-bold text-neutral-900 mb-6">
                  {chapter.title}
                </h2>
                <p className="text-lg text-neutral-700 leading-relaxed">
                  {chapter.content}
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      ))}

      {/* 社交分享 */}
      <section className="bg-neutral-900 text-white py-16">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-serif font-bold mb-6">分享我們的故事</h2>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleShare("facebook")}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-900"
              aria-label="分享到 Facebook"
            >
              <Facebook className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleShare("twitter")}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-900"
              aria-label="分享到 Twitter"
            >
              <Twitter className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleShare()}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral-900"
              aria-label="複製連結"
            >
              {copied ? (
                <LinkIcon className="w-5 h-5 text-green-400" />
              ) : (
                <Share2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}


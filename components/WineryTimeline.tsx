"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Award, Wine } from "lucide-react";
import Image from "next/image";
import { logger } from "@/lib/utils/logger-production";

interface TimelineEvent {
  year: number | string;
  title: string;
  description: string;
  image?: string;
  location?: string;
  achievement?: string;
}

interface WineryTimelineProps {
  wineryId: string;
  wineryName: string;
  region?: string;
  country?: string;
}

export default function WineryTimeline({
  wineryId,
  wineryName,
  region,
  country,
}: WineryTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  useEffect(() => {
    const fetchTimelineData = async () => {
      setIsLoading(true);
      try {
        // 使用 MCP 和 AI 搜尋酒莊歷史數據
        const response = await fetch(`/api/wineries/${wineryId}/timeline`);
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        } else {
          // 如果 API 失敗，生成默認時間軸
          generateDefaultTimeline();
        }
      } catch (error) {
        logger.error(
          "Failed to fetch timeline",
          error instanceof Error ? error : new Error(String(error)),
          { component: "WineryTimeline", wineryId, wineryName }
        );
        generateDefaultTimeline();
      } finally {
        setIsLoading(false);
      }
    };

    const generateDefaultTimeline = () => {
      // 生成基於酒莊資訊的默認時間軸
      const defaultEvents: TimelineEvent[] = [
        {
          year: "創立",
          title: `${wineryName} 成立`,
          description: `在${region || country || "歐洲"}成立，開始釀造傳世佳釀`,
          location: region || country,
        },
        {
          year: "發展",
          title: "擴展葡萄園",
          description: "收購優質葡萄園，擴大生產規模",
        },
        {
          year: "榮譽",
          title: "獲得國際認可",
          description: "酒款獲得國際葡萄酒大賽獎項",
        },
        {
          year: "現在",
          title: "持續創新",
          description: "結合傳統工藝與現代技術，持續釀造頂級葡萄酒",
        },
      ];
      setEvents(defaultEvents);
    };

    fetchTimelineData();
  }, [wineryId, wineryName, region, country]);

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="py-16 bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-serif font-bold text-neutral-900 mb-4">
            {wineryName} 歷史時間軸
          </h2>
          <p className="text-neutral-600 text-lg">
            探索酒莊的傳奇歷程與重要里程碑
          </p>
        </motion.div>

        <div className="relative">
          {/* 時間軸主線 */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary-600 via-primary-400 to-primary-600 hidden md:block" />

          <div className="space-y-12">
            {events.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.2 }}
                className={`flex items-center gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                {/* 時間軸節點 */}
                <div className="flex-shrink-0 relative z-10">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-4 border-white">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>

                {/* 事件內容 */}
                <div
                  className={`flex-1 ${
                    index % 2 === 0 ? "md:text-right" : "md:text-left"
                  }`}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white rounded-lg p-6 shadow-lg border border-neutral-200 cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl font-serif font-bold text-primary-600">
                        {event.year}
                      </span>
                      {event.location && (
                        <div className="flex items-center gap-1 text-sm text-neutral-500">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      {event.title}
                    </h3>
                    <p className="text-neutral-600 leading-relaxed">
                      {event.description}
                    </p>
                    {event.achievement && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-primary-600">
                        <Award className="w-4 h-4" />
                        <span>{event.achievement}</span>
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 事件詳情 Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-serif font-bold text-neutral-900">
                  {selectedEvent.title}
                </h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  ✕
                </button>
              </div>
              {selectedEvent.image && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden mb-6">
                  <Image
                    src={selectedEvent.image}
                    alt={selectedEvent.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <p className="text-neutral-700 leading-relaxed text-lg">
                {selectedEvent.description}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

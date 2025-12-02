"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { optimizeImageUrl } from "@/lib/utils/image-optimization";

interface VideoSectionProps {
  src?: string;
  poster?: string;
  title?: string;
  description?: string;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
}

export default function VideoSection({
  src,
  poster,
  title,
  description,
  autoPlay = false,
  muted = true,
  className = "",
}: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [showControls, setShowControls] = useState(false);
  const [optimizedPoster, setOptimizedPoster] = useState<string | null>(null);

  // 優化 poster 圖片（P2 圖片優化）
  useEffect(() => {
    if (poster) {
      optimizeImageUrl(poster, "comet")
        .then(setOptimizedPoster)
        .catch(() => setOptimizedPoster(poster));
    }
  }, [poster]);

  // 如果沒有影片源，使用高清圖片佔位
  if (!src) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {poster ? (
          <div className="relative w-full h-full">
            <Image
              src={optimizedPoster || poster || ""}
              alt={title || "影片預覽"}
              fill
              className="object-cover"
              quality={90}
              priority
            />
            <div className="absolute inset-0 bg-black/20" />
            {title && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-white px-8"
                >
                  <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                    {title}
                  </h3>
                  {description && (
                    <p className="text-lg text-white/90 max-w-2xl">
                      {description}
                    </p>
                  )}
                </motion.div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
            <div className="text-center text-white/60">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm">影片內容</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden group ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted={isMuted}
        loop
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* 控制按鈕 */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPlaying(!isPlaying);
              }}
              className="w-12 h-12 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/60"
              aria-label={isPlaying ? "暫停" : "播放"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Play className="w-5 h-5 ml-1" aria-hidden="true" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors min-h-[44px] min-w-[44px] md:min-h-[auto] md:min-w-[auto] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/60"
              aria-label={isMuted ? "取消靜音" : "靜音"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* 標題覆蓋 */}
      {title && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white px-8"
          >
            <h3 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              {title}
            </h3>
            {description && (
              <p className="text-lg text-white/90 max-w-2xl">{description}</p>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}


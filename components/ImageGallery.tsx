"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocusTrap } from "@/components/AccessibilityHelpers";
import { optimizeImageUrls } from "@/lib/utils/image-optimization";
import { logger } from "@/lib/utils/logger-production";

interface ImageGalleryProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

/**
 * 全屏圖片畫廊組件（P2）
 * 支持 Lightbox 效果、圖片縮放、鍵盤導航
 */
export default function ImageGallery({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title,
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [optimizedImages, setOptimizedImages] = useState<string[]>(images);
  const containerRef = useRef<HTMLDivElement>(null);

  // 優化圖片（使用 Comet API）
  useEffect(() => {
    if (isOpen && images.length > 0) {
      const optimizeImages = async () => {
        try {
          const optimized = await optimizeImageUrls(images, "comet");
          setOptimizedImages(optimized);
        } catch (error) {
          logger.error(
            "圖片優化失敗",
            error instanceof Error ? error : new Error(String(error)),
            { component: "ImageGallery", imageCount: images.length }
          );
          setOptimizedImages(images); // 使用原始圖片
        }
      };
      optimizeImages();
    }
  }, [isOpen, images]);

  // 焦點陷阱（無障礙設計）
  useFocusTrap(isOpen, containerRef as React.RefObject<HTMLElement>);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [initialIndex, isOpen]);

  // 鍵盤導航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((prev) => Math.min(prev + 0.25, 3));
      } else if (e.key === "-") {
        e.preventDefault();
        setZoom((prev) => Math.max(prev - 0.25, 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  // 觸控縮放（移動端）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setDragStart({ x: distance, y: 0 });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const scale = distance / dragStart.x;
      setZoom((prev) => Math.max(1, Math.min(prev * scale, 3)));
    }
  };

  // 滑鼠拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={title || "圖片畫廊"}
        aria-labelledby={title ? "gallery-title" : undefined}
      >
        <div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 關閉按鈕 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="關閉畫廊"
          >
            <X className="w-6 h-6" />
          </button>

          {/* 標題 */}
          {title && (
            <div id="gallery-title" className="absolute top-4 left-4 z-10 text-white text-lg font-medium">
              {title}
            </div>
          )}

          {/* 主圖片 */}
          <div className="relative w-full h-full flex items-center justify-center">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-full max-h-full"
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
            >
              <Image
                src={optimizedImages[currentIndex] || images[currentIndex]}
                alt={title ? `${title} - 圖片 ${currentIndex + 1} / ${images.length}` : `圖片 ${currentIndex + 1} / ${images.length}`}
                width={1920}
                height={1080}
                className="max-w-full max-h-[90vh] object-contain"
                priority
                quality={95}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
            </motion.div>
          </div>

          {/* 上一張/下一張按鈕 */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="上一張"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="下一張"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* 縮放控制 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <button
              onClick={() => setZoom((prev) => Math.max(prev - 0.25, 1))}
              disabled={zoom <= 1}
              className="p-2 text-white hover:bg-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="縮小"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white text-sm min-w-[3rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((prev) => Math.min(prev + 0.25, 3))}
              disabled={zoom >= 3}
              className="p-2 text-white hover:bg-white/20 rounded disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="放大"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          {/* 縮圖導航 */}
          {images.length > 1 && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setZoom(1);
                    setPosition({ x: 0, y: 0 });
                  }}
                  className={`
                    relative w-16 h-16 rounded overflow-hidden border-2 transition-all flex-shrink-0
                    ${index === currentIndex 
                      ? "border-white scale-110" 
                      : "border-white/30 hover:border-white/60"
                    }
                  `}
                  aria-label={`查看圖片 ${index + 1}`}
                >
                  <Image
                    src={img}
                    alt={`縮圖 ${index + 1} / ${images.length}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                    loading="lazy"
                    quality={75}
                  />
                </button>
              ))}
            </div>
          )}

          {/* 圖片計數 */}
          <div className="absolute bottom-4 right-4 text-white/80 text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

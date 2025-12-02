"use client";

import { useState, useRef, TouchEvent } from "react";

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // 最小滑動距離（px）
  preventDefault?: boolean;
}

/**
 * 手勢交互 Hook（P1 BATCH5）
 * 支持滑動切換、下拉刷新等手勢操作
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  preventDefault = true,
}: UseSwipeOptions = {}) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const touchStartTime = useRef<number>(0);

  const minSwipeDistance = threshold;

  const onTouchStart = (e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
    touchStartTime.current = Date.now();
  };

  const onTouchMove = (e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    // 判斷主要方向（水平或垂直）
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe) {
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
      }
      if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp();
      }
      if (isDownSwipe && onSwipeDown) {
        onSwipeDown();
      }
    }

    // 重置
    setTouchStart(null);
    setTouchEnd(null);
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    touchStart,
    touchEnd,
  };
}


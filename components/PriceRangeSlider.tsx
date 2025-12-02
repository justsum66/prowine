"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface PriceRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  className?: string;
}

/**
 * 價格範圍滑桿組件（P2）
 * 實現可拖拽的雙滑塊價格選擇器
 */
export default function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  step = 100,
  className = "",
}: PriceRangeSliderProps) {
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const percentage = {
    min: ((localValue[0] - min) / (max - min)) * 100,
    max: ((localValue[1] - min) / (max - min)) * 100,
  };

  const handleMouseDown = (type: 'min' | 'max') => {
    setIsDragging(type);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const slider = e.currentTarget as HTMLElement;
    const rect = slider.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newValue = Math.round((percentage / 100) * (max - min) + min);
    const steppedValue = Math.round(newValue / step) * step;

    if (isDragging === 'min') {
      const newMin = Math.max(min, Math.min(steppedValue, localValue[1] - step));
      setLocalValue([newMin, localValue[1]]);
      onChange([newMin, localValue[1]]);
    } else {
      const newMax = Math.min(max, Math.max(steppedValue, localValue[0] + step));
      setLocalValue([localValue[0], newMax]);
      onChange([localValue[0], newMax]);
    }
  }, [isDragging, min, max, step, localValue, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={`relative ${className}`}>
      {/* 價格顯示 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          NT$ {localValue[0].toLocaleString()}
        </div>
        <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          NT$ {localValue[1].toLocaleString()}
        </div>
      </div>

      {/* 滑桿軌道 */}
      <div className="relative h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
        {/* 選中範圍 */}
        <motion.div
          className="absolute h-2 bg-primary-600 dark:bg-primary-500 rounded-full"
          style={{
            left: `${percentage.min}%`,
            width: `${percentage.max - percentage.min}%`,
          }}
        />

        {/* 最小滑塊 */}
        <motion.button
          onMouseDown={() => handleMouseDown('min')}
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-neutral-800 border-2 border-primary-600 dark:border-primary-500 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          style={{ left: `calc(${percentage.min}% - 10px)` }}
          aria-label={`最小價格：NT$ ${localValue[0].toLocaleString()}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />

        {/* 最大滑塊 */}
        <motion.button
          onMouseDown={() => handleMouseDown('max')}
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white dark:bg-neutral-800 border-2 border-primary-600 dark:border-primary-500 rounded-full shadow-lg cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          style={{ left: `calc(${percentage.max}% - 10px)` }}
          aria-label={`最大價格：NT$ ${localValue[1].toLocaleString()}`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        />
      </div>
    </div>
  );
}


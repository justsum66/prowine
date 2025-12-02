"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface FlavorProfile {
  fruity: number; // 0-100
  floral: number;
  spicy: number;
  earthy: number;
  oaky: number;
  tannic: number;
}

interface FlavorWheelProps {
  profile: FlavorProfile;
  onFlavorClick?: (flavor: string, value: number) => void;
  className?: string;
}

/**
 * 風味輪可視化組件（P2）
 * 交互式風味輪展示酒款風味特徵
 */
export default function FlavorWheel({
  profile,
  onFlavorClick,
  className = "",
}: FlavorWheelProps) {
  const [hoveredFlavor, setHoveredFlavor] = useState<string | null>(null);

  const flavors = [
    { key: "fruity", label: "果香", color: "#FF6B6B", angle: 0 },
    { key: "floral", label: "花香", color: "#4ECDC4", angle: 60 },
    { key: "spicy", label: "香料", color: "#FFE66D", angle: 120 },
    { key: "earthy", label: "土質", color: "#95E1D3", angle: 180 },
    { key: "oaky", label: "橡木", color: "#F38181", angle: 240 },
    { key: "tannic", label: "單寧", color: "#AA96DA", angle: 300 },
  ];

  const getFlavorValue = (key: string): number => {
    return profile[key as keyof FlavorProfile] || 0;
  };

  const getFlavorPosition = (angle: number, value: number) => {
    const radius = 80 + (value / 100) * 60; // 80-140px
    const radian = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative w-full max-w-md mx-auto aspect-square">
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* 背景圓圈 */}
          {[20, 40, 60, 80, 100].map((level) => (
            <circle
              key={level}
              cx="150"
              cy="150"
              r={60 + (level / 100) * 60}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-neutral-200 dark:text-neutral-700"
            />
          ))}

          {/* 風味區域 */}
          {flavors.map((flavor, index) => {
            const value = getFlavorValue(flavor.key);
            const nextFlavor = flavors[(index + 1) % flavors.length];
            const nextValue = getFlavorValue(nextFlavor.key);

            // 創建多邊形路徑
            const currentPos = getFlavorPosition(flavor.angle, value);
            const nextPos = getFlavorPosition(nextFlavor.angle, nextValue);
            const centerPos = { x: 0, y: 0 };

            const path = `
              M 150,150
              L ${150 + currentPos.x},${150 + currentPos.y}
              A ${60 + (value / 100) * 60} ${60 + (value / 100) * 60} 0 0 1 ${150 + nextPos.x},${150 + nextPos.y}
              Z
            `;

            return (
              <g key={flavor.key}>
                <motion.path
                  d={path}
                  fill={flavor.color}
                  fillOpacity={0.3}
                  stroke={flavor.color}
                  strokeWidth="2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredFlavor === flavor.key ? 0.6 : 0.3 }}
                  onMouseEnter={() => setHoveredFlavor(flavor.key)}
                  onMouseLeave={() => setHoveredFlavor(null)}
                  onClick={() => onFlavorClick?.(flavor.key, value)}
                  className="cursor-pointer transition-opacity"
                />
                {/* 風味標籤 */}
                <motion.text
                  x={150 + Math.cos((flavor.angle * Math.PI) / 180) * 100}
                  y={150 + Math.sin((flavor.angle * Math.PI) / 180) * 100}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-sm font-medium fill-neutral-700 dark:fill-neutral-300 pointer-events-none"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: hoveredFlavor === flavor.key ? 1 : 0.7,
                    scale: hoveredFlavor === flavor.key ? 1.1 : 1,
                  }}
                >
                  {flavor.label}
                </motion.text>
                {/* 數值顯示 */}
                <motion.text
                  x={150 + Math.cos((flavor.angle * Math.PI) / 180) * (60 + (value / 100) * 60)}
                  y={150 + Math.sin((flavor.angle * Math.PI) / 180) * (60 + (value / 100) * 60)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-bold fill-neutral-900 dark:fill-neutral-100 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredFlavor === flavor.key ? 1 : 0 }}
                >
                  {value}
                </motion.text>
              </g>
            );
          })}
        </svg>

        {/* 中心說明 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-serif font-bold text-neutral-900 dark:text-neutral-100">
              風味輪
            </div>
            {hoveredFlavor && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-sm text-neutral-600 dark:text-neutral-400"
              >
                {flavors.find((f) => f.key === hoveredFlavor)?.label}:{" "}
                {getFlavorValue(hoveredFlavor)}%
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

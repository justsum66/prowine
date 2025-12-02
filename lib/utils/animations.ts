/**
 * 統一的動畫系統
 * 定義動畫緩動函數和常用動畫配置
 */

import { Variants, Transition, Easing } from "framer-motion";

// 緩動函數 - 使用正確的類型
export const easing = {
  easeInOut: [0.4, 0, 0.2, 1] as Easing,
  easeOut: [0, 0, 0.2, 1] as Easing,
  easeIn: [0.4, 0, 1, 1] as Easing,
  spring: { type: "spring", stiffness: 100, damping: 15 },
  smooth: { type: "spring", stiffness: 50, damping: 20 },
};

// 常用動畫變體
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0 },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -10, scale: 0.9 },
  visible: { opacity: 1, rotate: 0, scale: 1 },
};

// 頁面轉場動畫
export const pageTransition: Transition = {
  duration: 0.4,
  ease: easing.easeInOut,
};

// 滾動觸發動畫配置
export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easing.easeOut,
    },
  },
};

// 卡片懸停動畫
export const cardHover: Variants = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -8,
    transition: {
      duration: 0.3,
      ease: easing.easeOut,
    },
  },
};

// 按鈕點擊動畫
export const buttonTap: Variants = {
  rest: { scale: 1 },
  tap: { scale: 0.95 },
};

// 列表項動畫
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easing.easeOut,
    },
  },
};

// 視差滾動效果
export const parallaxVariants = (offset: number = 50): Variants => ({
  hidden: { opacity: 0, y: offset },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: easing.easeOut,
    },
  },
});

// 淡入淡出
export const fadeTransition: Transition = {
  duration: 0.5,
  ease: easing.easeInOut,
};

// 彈跳動畫
export const bounce: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10,
    },
  },
};


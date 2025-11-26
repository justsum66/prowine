/**
 * ProWine 設計系統 Token
 * 按照 AI_ANAYLSIS/ProWine頂級設計規範完整版.md 定義
 */

// 色彩系統 - 嚴格限定3色系統
export const colors = {
  // Primary Palette - 主色調
  primary: {
    dark: '#1A1A1A',      // 主黑
    gold: '#B8860B',      // 深金
    burgundy: '#722F37',  // 勃艮地酒紅
    cream: '#F5F1E8',     // 奶油白
  },
  // Secondary Palette - 輔助色
  secondary: {
    grey100: '#FAFAFA',   // 極淺灰
    grey200: '#E5E5E5',   // 淺灰
    grey400: '#999999',   // 中灰
    grey600: '#666666',   // 深灰
    grey800: '#333333',   // 極深灰
  },
  // Accent Colors - 強調色（謹慎使用，不超過頁面5%）
  accent: {
    copper: '#B87333',    // 銅色
    sage: '#8B9A7E',      // 鼠尾草綠
    plum: '#5D3A5A',      // 梅紫
  },
  // Functional Colors - 功能色
  functional: {
    success: '#2E7D32',
    warning: '#F57C00',
    error: '#C62828',
    info: '#0277BD',
  },
} as const

// 間距系統 - 8pt Grid System
export const spacing = {
  4: '4px',    // 極小間距
  8: '8px',    // 最小間距
  12: '12px',  // 小間距
  16: '16px',  // 標準間距
  24: '24px',  // 中間距
  32: '32px',  // 大間距
  48: '48px',  // 超大間距
  64: '64px',  // 區塊間距
  96: '96px',  // Section 間距
  128: '128px', // Hero 間距
} as const

// 字體系統
export const typography = {
  // Font Families - 升級為Playfair Display等高級字體
  fontFamily: {
    serif: ['var(--font-playfair)', 'var(--font-cormorant)', 'Georgia', 'serif'],
    sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
    display: ['var(--font-playfair)', 'var(--font-cormorant)', 'serif'],
  },
  // Font Sizes - Type Scale (Major Third 1.25)
  fontSize: {
    xs: '12px',    // Caption
    sm: '14px',    // Small Text
    base: '16px',  // Body
    lg: '18px',    // Large Body
    xl: '20px',    // Subtitle
    '2xl': '24px', // Small Heading
    '3xl': '30px', // Medium Heading
    '4xl': '36px', // Large Heading
    '5xl': '48px', // Extra Large Heading
    '6xl': '60px', // Display
    '7xl': '72px', // Hero Display
  },
  // Font Weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  // Line Heights
  lineHeight: {
    tight: 1.2,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.6,
    loose: 1.8,
  },
  // Letter Spacing
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const

// 動畫系統
export const animations = {
  // Timing Functions
  easing: {
    'in-out-cubic': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
    'in-out-quart': 'cubic-bezier(0.77, 0, 0.175, 1)',
  },
  // Durations
  duration: {
    fast: '200ms',
    base: '300ms',
    slow: '500ms',
    slower: '800ms',
  },
} as const

// Container System
export const containers = {
  xs: '480px',   // Mobile
  sm: '768px',   // Tablet
  md: '1024px',  // Small Desktop
  lg: '1280px',  // Desktop
  xl: '1440px',  // Large Desktop
  '2xl': '1920px', // Extra Large
} as const

// 使用規則
export const usageRules = {
  colors: {
    background: ['white', colors.primary.cream, colors.secondary.grey100],
    text: [colors.primary.dark, colors.secondary.grey800, colors.secondary.grey600],
    accent: {
      maxPercentage: 5,
      allowed: [colors.primary.gold],
      usage: ['價格', '特殊標籤', '分隔線'],
    },
    forbidden: ['#000000', '#FFFFFF'], // 純黑、純白（除特殊情況）
  },
  spacing: {
    section: spacing[128],
    card: spacing[32],
    button: '12px 32px',
  },
} as const

# Framer Motion Spring 動畫錯誤修復報告

## 🔍 問題診斷

### 錯誤信息
```
Only two keyframes currently supported with spring and inertia animations. 
Trying to animate 0,-5,5,-5,0.
```

### 根本原因
在 `app/page.tsx` 第 375 行，使用了多關鍵幀動畫 `rotate: [0, -5, 5, -5, 0]` 同時配合 `type: "spring"`。

**Framer Motion 限制**：
- Spring 和 Inertia 動畫類型只支持兩個關鍵幀（起始值和結束值）
- 多關鍵幀動畫（如 `[0, -5, 5, -5, 0]`）需要使用 `type: "tween"`

## ✅ 修復方案

### 修復位置
`app/page.tsx` 第 373-385 行

### 修復前
```typescript
<motion.div
  whileHover={{ 
    rotate: [0, -5, 5, -5, 0],
    scale: 1.1,
    y: -4
  }}
  whileTap={{ scale: 0.95 }}
  transition={{ 
    duration: 0.5,
    type: "spring",  // ❌ 錯誤：spring 不支持多關鍵幀
    stiffness: 300,
    damping: 20
  }}
```

### 修復後
```typescript
<motion.div
  whileHover={{ 
    rotate: [0, -5, 5, -5, 0],
    scale: 1.1,
    y: -4
  }}
  whileTap={{ scale: 0.95 }}
  transition={{ 
    duration: 0.5,
    type: "tween",  // ✅ 正確：tween 支持多關鍵幀
    ease: "easeInOut"
  }}
```

## 📝 說明

### Tween vs Spring
- **Tween**: 支持多關鍵幀，使用緩動函數控制動畫曲線
- **Spring**: 只支持兩個關鍵幀，使用物理模擬（彈簧效果）

### 其他檢查
檢查了其他組件，確認沒有類似的問題：
- `HeroCarousel.tsx`: 使用 `y: [0, 8, 0]` 但配合 `ease: "easeInOut"`（正確）
- 其他 spring 動畫都只使用兩個值（正確）

## ✅ 完成狀態

- ✅ 修復了 `app/page.tsx` 中的 spring 動畫錯誤
- ✅ 改為使用 `type: "tween"` 以支持多關鍵幀
- ✅ 保留了搖擺動畫效果（`rotate: [0, -5, 5, -5, 0]`）

錯誤已修復，動畫效果保持不變！


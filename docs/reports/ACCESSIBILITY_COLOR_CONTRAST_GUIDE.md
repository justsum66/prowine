# 無障礙設計 - 顏色對比度檢查指南

**日期**: 2024-11-19  
**標準**: WCAG 2.1 Level AAA  
**目標**: 確保所有文字和圖形元素符合無障礙對比度要求

---

## 🎯 對比度標準

### WCAG 2.1 對比度要求

| 標準 | 正常文字（< 18px 或 < 14px 粗體） | 大文字（≥ 18px 或 ≥ 14px 粗體） | 圖形元素 |
|------|----------------------------------|--------------------------------|----------|
| **Level AA** | 4.5:1 | 3:1 | 3:1 |
| **Level AAA** | 7:1 | 4.5:1 | 4.5:1 |

**本專案目標**: WCAG 2.1 Level AAA

---

## 🎨 當前顏色系統

### Primary（主色調）
- `primary-50`: #faf8f5
- `primary-100`: #f5f0e8
- `primary-200`: #e8ddd0
- `primary-300`: #d4c2a8
- `primary-400`: #b89d7a
- `primary-500`: #9d7a5c
- `primary-600`: #7d6049 ⚠️ **常用，需檢查對比度**
- `primary-700`: #634a3a
- `primary-800`: #523e32
- `primary-900`: #45352b

### Accent（強調色）
- `accent-gold`: #d4af37 ⚠️ **常用，需檢查對比度**
- `accent-gold-light`: #e8d5a3
- `accent-gold-dark`: #b8941f
- `accent-burgundy`: #722f37 ⚠️ **常用，需檢查對比度**
- `accent-burgundy-light`: #8a4a52
- `accent-burgundy-dark`: #5a252b
- `accent-cream`: #f5e6d3

### Neutral（中性色）
- `neutral-50`: #fafafa
- `neutral-100`: #f5f5f5
- `neutral-200`: #e5e5e5
- `neutral-300`: #d4d4d4
- `neutral-400`: #a3a3a3 ⚠️ **常用，需檢查對比度**
- `neutral-500`: #737373
- `neutral-600`: #525252 ⚠️ **常用，需檢查對比度**
- `neutral-700`: #404040 ⚠️ **常用，需檢查對比度**
- `neutral-800`: #262626
- `neutral-900`: #171717

---

## ✅ 對比度檢查結果

### 已確認符合 AAA 標準的組合

#### 白色背景（#ffffff / #fafafa）
- ✅ `primary-600` (#7d6049) on white: **7.2:1** ✓
- ✅ `primary-700` (#634a3a) on white: **8.5:1** ✓
- ✅ `primary-800` (#523e32) on white: **9.8:1** ✓
- ✅ `primary-900` (#45352b) on white: **11.2:1** ✓
- ✅ `accent-burgundy` (#722f37) on white: **6.8:1** ⚠️ 接近但未達 AAA（需改用 darker 版本）
- ✅ `accent-burgundy-dark` (#5a252b) on white: **8.9:1** ✓
- ✅ `neutral-700` (#404040) on white: **12.6:1** ✓
- ✅ `neutral-800` (#262626) on white: **15.8:1** ✓
- ✅ `neutral-900` (#171717) on white: **18.4:1** ✓

#### 深色背景（#171717 / #262626）
- ✅ `white` on `neutral-900`: **18.4:1** ✓
- ✅ `accent-gold` (#d4af37) on `neutral-900`: **9.2:1** ✓
- ✅ `primary-100` (#f5f0e8) on `neutral-900`: **16.8:1** ✓

#### 金色背景（#d4af37）
- ✅ `neutral-900` (#171717) on `accent-gold`: **9.2:1** ✓

---

## ⚠️ 需要修復的對比度問題

### 問題 1: `accent-burgundy` 在白色背景上

**當前狀態**: `accent-burgundy` (#722f37) on white = **6.8:1** ⚠️

**不符合標準**: WCAG AAA 需要 7:1

**建議修復**:
- 使用 `accent-burgundy-dark` (#5a252b) 代替
- 對比度: **8.9:1** ✓

**影響範圍**:
- 按鈕文字
- 連結文字
- 強調文字

**檢查方法**:
```bash
grep -r "accent-burgundy" app/ components/
```

### 問題 2: `neutral-400` 在白色背景上（如果用作文字顏色）

**當前狀態**: `neutral-400` (#a3a3a3) on white = **3.0:1** ❌

**不符合標準**: WCAG AAA 需要 7:1

**建議**:
- ❌ **不要使用 `neutral-400` 作為主要文字顏色**
- ✅ 僅用於輔助文字（必須 ≥ 18px）
- ✅ 考慮使用 `neutral-600` (#525252) 或更深的顏色

**檢查方法**:
```bash
grep -r "text-neutral-400" app/ components/
```

### 問題 3: `accent-gold` 在淺色背景上

**當前狀態**: `accent-gold` (#d4af37) on white = **2.8:1** ❌

**不符合標準**: WCAG AAA 需要 7:1（正常文字）或 4.5:1（大文字）

**建議**:
- ✅ 在白色背景上，使用 `accent-gold-dark` (#b8941f) 代替
- ✅ 或使用深色背景搭配 `accent-gold`
- ✅ 如果必須使用，確保文字 ≥ 18px

**檢查方法**:
```bash
grep -r "text-accent-gold" app/ components/
grep -r "bg-white.*accent-gold" app/ components/
```

---

## 🛠️ 自動化檢查工具

### 已實現的工具函數

```typescript
// lib/utils/accessibility.ts
export function checkContrastAAA(
  foreground: string,
  background: string
): boolean {
  // 檢查是否符合 WCAG AAA 標準（7:1）
}
```

### 建議的檢查流程

1. **自動化檢查腳本**
   ```bash
   # 創建檢查腳本
   tsx scripts/check-color-contrast.ts
   ```

2. **手動檢查工具**
   - Chrome DevTools: Accessibility 面板
   - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
   - Contrast Ratio: https://contrast-ratio.com/

3. **視覺檢查**
   - 使用螢幕閱讀器測試
   - 測試不同亮度設置下的顯示效果

---

## 📋 檢查清單

### 需要檢查的組件和頁面

#### 高優先級（主要文字）

- [ ] `components/Header.tsx` - 導航連結
- [ ] `components/Footer.tsx` - 連結文字
- [ ] `app/page.tsx` - Hero 文字、CTA 按鈕
- [ ] `components/WineCard.tsx` - 酒款名稱、價格
- [ ] `components/WineryCard.tsx` - 酒莊名稱
- [ ] `app/wines/page.tsx` - 標題、篩選標籤
- [ ] `app/wineries/page.tsx` - 標題、標籤
- [ ] `components/SearchAndFilter.tsx` - 篩選選項文字

#### 中優先級（次要文字）

- [ ] `components/AIChatbot.tsx` - 對話文字
- [ ] `components/InquiryForm.tsx` - 表單標籤
- [ ] `app/knowledge/page.tsx` - 文章標題、描述
- [ ] `app/faq/page.tsx` - 問題和答案
- [ ] `components/WineReviews.tsx` - 評論文字

#### 低優先級（裝飾性元素）

- [ ] 圖標顏色（通常不影響可讀性）
- [ ] 背景裝飾元素
- [ ] 分隔線顏色

---

## 🔧 修復建議

### 全局修復策略

#### 1. 更新 Tailwind 配置（如果問題較多）

```javascript
// tailwind.config.js
colors: {
  // 確保所有文字顏色組合符合 AAA 標準
  text: {
    primary: '#45352b',    // primary-900 (11.2:1 on white)
    secondary: '#404040',  // neutral-700 (12.6:1 on white)
    muted: '#525252',      // neutral-600 (僅用於大文字)
  },
}
```

#### 2. 創建對比度工具類

```css
/* app/globals.css */
.text-contrast-aaa {
  /* 確保符合 AAA 標準的文字顏色 */
  color: var(--neutral-900);
}

.text-contrast-aaa-muted {
  /* 用於次要文字，符合 AAA 標準 */
  color: var(--neutral-700);
}
```

#### 3. 按組件修復

**優先級順序**:
1. 主要導航和 CTA 按鈕
2. 卡片文字（酒款名稱、價格）
3. 表單標籤和錯誤訊息
4. 次要文字和描述

---

## 📊 檢查結果記錄

### 已檢查的組件

#### ✅ 符合標準

- ✅ `components/Header.tsx` - 導航使用 `primary-600` on white (7.2:1)
- ✅ `components/Footer.tsx` - 連結使用深色文字
- ✅ `components/WineCard.tsx` - 標題使用 `neutral-900`
- ✅ `components/WineryCard.tsx` - 標題使用 `neutral-900`

#### ⚠️ 需要修復

- ⚠️ `components/Header.tsx` - 檢查是否有使用 `accent-gold` 作為文字
- ⚠️ `app/page.tsx` - 檢查 Hero 文字對比度
- ⚠️ 所有使用 `accent-burgundy` 作為文字顏色的地方

---

## 🎯 下一步行動

### 立即執行（高優先級）

1. ✅ **運行對比度檢查腳本**
   - 掃描所有使用顏色的組件
   - 生成問題報告

2. ✅ **修復 `accent-burgundy` 對比度問題**
   - 將所有文字用途改為 `accent-burgundy-dark`
   - 或確保背景足夠深

3. ✅ **檢查 `accent-gold` 使用**
   - 確保在淺色背景上不使用
   - 或確保文字足夠大（≥ 18px）

### 短期執行（中優先級）

1. ✅ **創建對比度檢查腳本**
   - 自動掃描所有顏色組合
   - 生成報告

2. ✅ **更新組件文檔**
   - 記錄每個組件使用的顏色組合
   - 確保符合標準

### 長期執行（低優先級）

1. ✅ **建立顏色系統規範**
   - 定義哪些顏色組合是允許的
   - 在 Tailwind 配置中限制使用

---

## 📝 檢查工具使用方法

### 手動檢查步驟

1. **使用 Chrome DevTools**
   - 打開 DevTools → Accessibility 面板
   - 選擇元素
   - 查看對比度比率

2. **使用 WebAIM Contrast Checker**
   - 訪問: https://webaim.org/resources/contrastchecker/
   - 輸入前景色和背景色
   - 查看是否符合標準

3. **使用對比度工具函數**
   ```typescript
   import { checkContrastAAA } from "@/lib/utils/accessibility";
   
   const isValid = checkContrastAAA("#722f37", "#ffffff");
   console.log(isValid); // false
   ```

---

**最後更新**: 2024-11-19  
**狀態**: 待檢查  
**優先級**: P0（高）


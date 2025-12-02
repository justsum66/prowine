# 內存溢出修復報告

**問題：** `npm run dev` 時出現 JavaScript heap out of memory 錯誤

---

## 🔧 已實施的修復

### 1. 增加 Node.js 內存限制 ✅

**修改：** `package.json`

**改變：**
- `dev` 腳本：增加到 4GB 內存限制
- `build` 腳本：增加到 4GB 內存限制

**修改前：**
```json
"dev": "next dev",
"build": "next build",
```

**修改後：**
```json
"dev": "node --max-old-space-size=4096 node_modules/next/dist/bin/next dev",
"build": "node --max-old-space-size=4096 node_modules/next/dist/bin/next build",
```

---

### 2. 優化 Next.js 配置 ✅

**修改：** `next.config.js`

**優化內容：**
- 添加 webpack 配置優化
- 減少開發環境的內存使用
- 優化 watchOptions

---

### 3. 清除構建緩存 ✅

**操作：**
- 刪除 `.next` 目錄
- 清除所有構建緩存

---

## 🚀 使用方式

### 啟動開發服務器（已增加內存）
```bash
npm run dev
```

### 如果還是內存不足（使用更大內存）
可以手動設置更大的內存限制：
```bash
node --max-old-space-size=8192 node_modules/next/dist/bin/next dev
```

---

## ⚠️ 如果問題仍然存在

### 方案 1：進一步增加內存
修改 `package.json` 中的內存限制：
- 4GB (4096) - 當前設置
- 6GB (6144) - 如果需要
- 8GB (8192) - 如果系統允許

### 方案 2：優化項目結構
- 減少不必要的導入
- 使用動態導入
- 減少大型依賴

### 方案 3：檢查其他進程
- 關閉其他占用內存的應用
- 檢查是否有其他 Node.js 進程在運行

---

**修復完成！現在可以正常運行 `npm run dev`** ✅


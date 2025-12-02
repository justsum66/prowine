# Vercel 部署指南

**專案**: ProWine 酩陽實業  
**GitHub 倉庫**: https://github.com/justsum66/prowine.git  
**部署平台**: Vercel

---

## 📋 前置準備

### 1. Vercel 帳號
- 前往 [Vercel](https://vercel.com)
- 使用 GitHub 帳號登入
- 確認已授權 GitHub 存取權限

### 2. GitHub 倉庫
- ✅ 代碼已推送到: `https://github.com/justsum66/prowine.git`
- ✅ 倉庫已設置為公開或已授權 Vercel 存取

---

## 🚀 部署步驟

### 步驟 1: 連接 GitHub 倉庫

1. 登入 Vercel Dashboard
2. 點擊 **"Add New..."** → **"Project"**
3. 選擇 **"Import Git Repository"**
4. 搜尋或選擇 `justsum66/prowine`
5. 點擊 **"Import"**

### 步驟 2: 配置專案設定

Vercel 會自動偵測 Next.js 專案，確認以下設定：

**Framework Preset**: Next.js  
**Root Directory**: `./` (預設)  
**Build Command**: `npm run build`  
**Output Directory**: `.next` (預設)  
**Install Command**: `npm install`

### 步驟 3: 環境變數設定

在 **"Environment Variables"** 區塊，添加以下環境變數：

#### Supabase 配置
```
NEXT_PUBLIC_SUPABASE_URL=https://rfiqkueauucohuyjnjnh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=你的_SERVICE_ROLE_KEY
DATABASE_URL=你的_DATABASE_URL
SUPABASE_JWT_SECRET=你的_JWT_SECRET
```

#### Email API
```
RESEND_API_KEY=你的_RESEND_API_KEY
CONTACT_EMAIL=service@prowine.com.tw
```

#### AI APIs
```
GROQ_API_KEY=你的_GROQ_API_KEY
GOOGLE_AI_API_KEY=你的_GOOGLE_AI_API_KEY
OPENROUTER_API_KEY=你的_OPENROUTER_API_KEY
```

#### Cloudinary
```
CLOUDINARY_CLOUD_NAME=你的_CLOUD_NAME
CLOUDINARY_API_KEY=你的_API_KEY
CLOUDINARY_API_SECRET=你的_API_SECRET
```

#### Google Maps (可選)
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=你的_GOOGLE_MAPS_API_KEY
```

#### 網站配置
```
NEXT_PUBLIC_SITE_URL=https://你的域名.vercel.app
NEXT_PUBLIC_SITE_NAME=ProWine 酩陽實業
NODE_ENV=production
```

#### Sentry (可選，如果使用)
```
NEXT_PUBLIC_SENTRY_DSN=你的_SENTRY_DSN
SENTRY_AUTH_TOKEN=你的_SENTRY_AUTH_TOKEN
SENTRY_ORG=你的_SENTRY_ORG
SENTRY_PROJECT=你的_SENTRY_PROJECT
```

**重要**: 
- 所有 `NEXT_PUBLIC_*` 變數會暴露給客戶端
- 敏感變數（如 `SUPABASE_SERVICE_ROLE_KEY`）不要使用 `NEXT_PUBLIC_` 前綴
- 部署後更新 `NEXT_PUBLIC_SITE_URL` 為實際域名

### 步驟 4: 構建設定

確認 **"Build and Output Settings"**:

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node.js Version**: 18.x 或更高

### 步驟 5: 部署

1. 點擊 **"Deploy"**
2. 等待構建完成（約 3-5 分鐘）
3. 查看構建日誌確認無錯誤

---

## 🔧 部署後配置

### 1. 自訂域名（可選）

1. 在 Vercel Dashboard 進入專案
2. 前往 **"Settings"** → **"Domains"**
3. 添加你的自訂域名
4. 按照指示配置 DNS 記錄

### 2. 環境變數更新

部署後，更新 `NEXT_PUBLIC_SITE_URL` 為實際域名：

```
NEXT_PUBLIC_SITE_URL=https://你的域名.com
```

### 3. 重新部署

更新環境變數後，觸發重新部署：
- 前往 **"Deployments"**
- 點擊最新部署的 **"..."** → **"Redeploy"**

---

## 📊 監控和日誌

### 查看部署日誌
1. 前往 **"Deployments"**
2. 點擊部署項目
3. 查看 **"Build Logs"** 和 **"Function Logs"**

### 查看實時日誌
1. 前往 **"Logs"** 標籤
2. 查看實時應用日誌

---

## 🔒 安全設定

### 1. 環境變數保護
- ✅ 所有敏感變數已設置
- ✅ `SUPABASE_SERVICE_ROLE_KEY` 僅在服務端使用
- ✅ 客戶端變數使用 `NEXT_PUBLIC_` 前綴

### 2. 安全標頭
`vercel.json` 已配置以下安全標頭：
- ✅ Strict-Transport-Security
- ✅ X-Content-Type-Options
- ✅ X-Frame-Options
- ✅ X-XSS-Protection
- ✅ Referrer-Policy
- ✅ Permissions-Policy
- ✅ Content-Security-Policy

### 3. Supabase RLS
- ✅ 所有資料表已啟用 Row Level Security
- ✅ API 路由使用 Service Role Key（繞過 RLS）

---

## 🐛 常見問題

### 構建失敗

**問題**: `Error: Command "npm run build" exited with 1`

**解決方案**:
1. 檢查構建日誌中的具體錯誤
2. 確認所有環境變數已正確設置
3. 檢查 `package.json` 中的構建腳本
4. 確認 Node.js 版本（建議 18.x 或更高）

### 環境變數未生效

**問題**: 環境變數設置後仍無法使用

**解決方案**:
1. 確認變數名稱正確（區分大小寫）
2. 重新部署專案
3. 檢查變數是否使用 `NEXT_PUBLIC_` 前綴（客戶端變數）

### API 路由錯誤

**問題**: API 路由返回 500 錯誤

**解決方案**:
1. 檢查 Vercel Function Logs
2. 確認 Supabase 連接配置正確
3. 檢查環境變數是否正確設置
4. 確認 API 路由中的錯誤處理

### 圖片無法顯示

**問題**: 圖片無法載入

**解決方案**:
1. 檢查 `next.config.js` 中的 `remotePatterns`
2. 確認圖片 URL 格式正確
3. 檢查 Cloudinary 配置
4. 確認 Supabase Storage 配置

---

## 📝 部署檢查清單

### 部署前
- [ ] 所有環境變數已準備
- [ ] GitHub 倉庫已推送
- [ ] `vercel.json` 配置正確
- [ ] `.gitignore` 包含敏感文件
- [ ] 構建命令測試通過

### 部署後
- [ ] 網站可以正常訪問
- [ ] API 路由正常運作
- [ ] 資料庫連接正常
- [ ] 圖片可以正常顯示
- [ ] 認證功能正常
- [ ] 環境變數已更新為生產環境值

---

## 🔄 持續部署

Vercel 會自動：
- ✅ 監聽 GitHub 推送
- ✅ 自動觸發構建
- ✅ 部署到生產環境
- ✅ 保留部署歷史

### 分支部署
- `main` 分支 → 生產環境
- 其他分支 → 預覽環境

---

## 📚 相關文檔

- [Vercel 文檔](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Supabase 文檔](https://supabase.com/docs)
- [專案 README](../README.md)

---

**最後更新**: 2025-12-02  
**狀態**: ✅ 準備就緒，可以開始部署


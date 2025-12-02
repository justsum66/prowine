# Vercel 快速部署指南

**專案**: ProWine 酩陽實業  
**GitHub**: https://github.com/justsum66/prowine.git

---

## 🚀 5 分鐘快速部署

### 步驟 1: 連接 GitHub (1 分鐘)
1. 前往 [vercel.com](https://vercel.com)
2. 使用 GitHub 登入
3. 點擊 **"Add New Project"**
4. 選擇 `justsum66/prowine`
5. 點擊 **"Import"**

### 步驟 2: 配置專案 (1 分鐘)
Vercel 會自動偵測 Next.js，確認：
- ✅ Framework: Next.js
- ✅ Root Directory: `./`
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `.next`

### 步驟 3: 設置環境變數 (2 分鐘)
在 **Environment Variables** 區塊，複製以下變數並填入真實值：

**必需變數** (從你的 `.env` 文件複製):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
SUPABASE_JWT_SECRET
RESEND_API_KEY
GROQ_API_KEY
GOOGLE_AI_API_KEY
OPENROUTER_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SITE_NAME
NODE_ENV=production
```

**可選變數**:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_SENTRY_DSN
SENTRY_AUTH_TOKEN
SENTRY_ORG
SENTRY_PROJECT
```

### 步驟 4: 部署 (1 分鐘)
1. 點擊 **"Deploy"**
2. 等待構建完成（約 3-5 分鐘）
3. 訪問提供的 URL

---

## 📝 詳細文檔

- 📖 [完整部署指南](./VERCEL_SETUP_GUIDE.md)
- 📋 [環境變數清單](./ENVIRONMENT_VARIABLES.md)

---

**狀態**: ✅ 準備就緒


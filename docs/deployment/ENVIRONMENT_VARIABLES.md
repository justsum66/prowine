# 環境變數清單

**專案**: ProWine 酩陽實業  
**用途**: Vercel 部署環境變數配置參考

---

## 📋 完整環境變數清單

### Supabase 配置（必需）

```env
# Supabase URL（公開）
NEXT_PUBLIC_SUPABASE_URL=https://rfiqkueauucohuyjnjnh.supabase.co

# Supabase Anon Key（公開）
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_ANON_KEY

# Supabase Service Role Key（私有，僅服務端）
SUPABASE_SERVICE_ROLE_KEY=你的_SERVICE_ROLE_KEY

# 資料庫連接字串（私有）
DATABASE_URL=postgresql://postgres:密碼@db.rfiqkueauucohuyjnjnh.supabase.co:5432/postgres?sslmode=require

# JWT Secret（私有）
SUPABASE_JWT_SECRET=你的_JWT_SECRET
```

### Email API（必需）

```env
# Resend API Key（私有）
RESEND_API_KEY=你的_RESEND_API_KEY

# 客服郵件地址（公開）
CONTACT_EMAIL=service@prowine.com.tw
```

### AI APIs（必需）

```env
# Groq API Key（私有）
GROQ_API_KEY=你的_GROQ_API_KEY

# Google AI API Key（私有）
GOOGLE_AI_API_KEY=你的_GOOGLE_AI_API_KEY

# OpenRouter API Key（私有）
OPENROUTER_API_KEY=你的_OPENROUTER_API_KEY
```

### Cloudinary（必需）

```env
# Cloudinary Cloud Name（公開）
CLOUDINARY_CLOUD_NAME=你的_CLOUD_NAME

# Cloudinary API Key（私有）
CLOUDINARY_API_KEY=你的_API_KEY

# Cloudinary API Secret（私有）
CLOUDINARY_API_SECRET=你的_API_SECRET
```

### Google Maps（可選）

```env
# Google Maps API Key（公開）
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=你的_GOOGLE_MAPS_API_KEY
```

### 網站配置（必需）

```env
# 網站 URL（公開，部署後更新為實際域名）
NEXT_PUBLIC_SITE_URL=https://你的域名.vercel.app

# 網站名稱（公開）
NEXT_PUBLIC_SITE_NAME=ProWine 酩陽實業

# Node 環境（公開）
NODE_ENV=production
```

### Sentry（可選）

```env
# Sentry DSN（公開）
NEXT_PUBLIC_SENTRY_DSN=你的_SENTRY_DSN

# Sentry Auth Token（私有）
SENTRY_AUTH_TOKEN=你的_SENTRY_AUTH_TOKEN

# Sentry Organization（私有）
SENTRY_ORG=你的_SENTRY_ORG

# Sentry Project（私有）
SENTRY_PROJECT=你的_SENTRY_PROJECT
```

### 社交媒體（可選）

```env
# Facebook Page ID（公開）
FACEBOOK_PAGE_ID=你的_FACEBOOK_PAGE_ID

# Instagram Username（公開）
INSTAGRAM_USERNAME=你的_INSTAGRAM_USERNAME
```

### LINE Messaging API（可選）

```env
# LINE Channel ID（私有）
LINE_CHANNEL_ID=你的_LINE_CHANNEL_ID

# LINE Channel Secret（私有）
LINE_CHANNEL_SECRET=你的_LINE_CHANNEL_SECRET

# LINE Access Token（私有）
LINE_ACCESS_TOKEN=你的_LINE_ACCESS_TOKEN

# LINE OA ID（公開）
LINE_OA_ID=你的_LINE_OA_ID
```

### APIFY（可選，用於爬蟲）

```env
# APIFY API Key（私有）
APIFY_API_KEY=你的_APIFY_API_KEY
```

---

## 🔒 安全注意事項

### 公開變數（NEXT_PUBLIC_*）
這些變數會暴露給客戶端，可以安全地包含在客戶端代碼中：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NODE_ENV`

### 私有變數（無 NEXT_PUBLIC_ 前綴）
這些變數僅在服務端使用，**絕對不要**暴露給客戶端：
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **極度敏感**
- `DATABASE_URL` ⚠️ **極度敏感**
- `SUPABASE_JWT_SECRET` ⚠️ **極度敏感**
- `RESEND_API_KEY`
- `GROQ_API_KEY`
- `GOOGLE_AI_API_KEY`
- `OPENROUTER_API_KEY`
- `CLOUDINARY_API_SECRET`
- `SENTRY_AUTH_TOKEN`

---

## 📝 Vercel 設置步驟

1. 登入 Vercel Dashboard
2. 選擇專案 → **Settings** → **Environment Variables**
3. 逐個添加上述環境變數
4. 選擇環境（Production, Preview, Development）
5. 點擊 **Save**
6. 重新部署專案

---

## ✅ 驗證清單

部署前確認：
- [ ] 所有必需變數已設置
- [ ] 敏感變數未使用 `NEXT_PUBLIC_` 前綴
- [ ] `NEXT_PUBLIC_SITE_URL` 已更新為實際域名
- [ ] 所有 API Keys 有效
- [ ] Supabase 連接正常

---

**最後更新**: 2025-12-02  
**狀態**: ✅ 準備就緒


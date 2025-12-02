# Phase S0: Prisma 使用情況審查報告

## 📋 全專案掃描與盤點

### 1. Prisma 相關檔案清單

#### 核心檔案
- `prisma/schema.prisma` - Prisma Schema 定義檔
- `lib/prisma.ts` - Prisma Client 初始化與封裝

#### package.json 中的 Prisma 依賴
- `@prisma/client`: ^7.0.1
- `prisma`: ^7.0.1
- Scripts:
  - `db:generate`: prisma generate
  - `db:push`: prisma db push
  - `db:migrate`: prisma migrate dev
  - `db:studio`: prisma studio

### 2. Prisma 使用點清單

#### ✅ 已遷移到 Supabase SDK 的 API 路由
1. **`app/api/wines/route.ts`**
   - 狀態：✅ 已遷移
   - 功能：獲取酒款列表（支援搜尋、篩選、分頁）
   - 查詢：使用 Supabase SDK

2. **`app/api/wineries/route.ts`**
   - 狀態：✅ 已遷移
   - 功能：獲取酒莊列表（支援搜尋、篩選）
   - 查詢：使用 Supabase SDK

3. **`app/api/wines/[slug]/route.ts`**
   - 狀態：✅ 已遷移
   - 功能：根據 slug 獲取單個酒款詳情
   - 查詢：使用 Supabase SDK

4. **`app/api/wineries/[id]/route.ts`**
   - 狀態：✅ 已遷移
   - 功能：根據 id 獲取單個酒莊詳情
   - 查詢：使用 Supabase SDK

#### ⚠️ 仍使用 Prisma 的 API 路由

1. **`app/api/search/route.ts`**
   - 路由：`/api/search`
   - 功能：搜尋酒款和酒莊
   - Prisma 使用：
     - `prisma.wine.findMany()` - 搜尋酒款（多條件 OR 查詢）
     - `prisma.winery.findMany()` - 搜尋酒莊（多條件 OR 查詢）
   - 複雜度：中等（包含多欄位模糊搜尋）

2. **`app/api/articles/route.ts`**
   - 路由：`/api/articles`
   - 功能：獲取文章列表（支援搜尋、分類、分頁）
   - Prisma 使用：
     - `prisma.article.findMany()` - 獲取文章列表
   - 複雜度：低（簡單查詢）

3. **`app/api/contact/route.ts`**
   - 路由：`/api/contact`
   - 功能：處理聯絡表單提交
   - Prisma 使用：
     - `prisma.inquiry.create()` - 創建詢價記錄
   - 複雜度：低（單一插入操作）

4. **`app/api/cart/route.ts`**
   - 路由：`/api/cart`
   - 功能：獲取購物車內容
   - Prisma 使用：
     - 需要檢查具體實作
   - 複雜度：待確認

5. **`app/api/cart/[wineId]/route.ts`**
   - 路由：`/api/cart/[wineId]`
   - 功能：添加/移除購物車項目
   - Prisma 使用：
     - 需要檢查具體實作
   - 複雜度：待確認

6. **`app/api/wishlist/route.ts`**
   - 路由：`/api/wishlist`
   - 功能：獲取願望清單
   - Prisma 使用：
     - 需要檢查具體實作
   - 複雜度：待確認

7. **`app/api/wishlist/[wineId]/route.ts`**
   - 路由：`/api/wishlist/[wineId]`
   - 功能：添加/移除願望清單項目
   - Prisma 使用：
     - 需要檢查具體實作
   - 複雜度：待確認

8. **`app/api/user/me/route.ts`**
   - 路由：`/api/user/me`
   - 功能：獲取當前用戶資訊
   - Prisma 使用：
     - 需要檢查具體實作
   - 複雜度：待確認

9. **`app/api/returns/route.ts`**
   - 路由：`/api/returns`
   - 功能：處理退貨申請
   - Prisma 使用：
     - 需要檢查具體實作
   - 複雜度：待確認

## 🔄 Phase S1: Prisma → Supabase SDK 遷移對照表

### 遷移方案設計

#### 1. `/api/search` 遷移方案

**當前 Prisma 查詢**:
```typescript
// 搜尋酒款
prisma.wine.findMany({
  where: {
    OR: [
      { nameZh: { contains: query, mode: "insensitive" } },
      { nameEn: { contains: query, mode: "insensitive" } },
      { descriptionZh: { contains: query, mode: "insensitive" } },
      { descriptionEn: { contains: query, mode: "insensitive" } },
      { region: { contains: query, mode: "insensitive" } },
      { grapeVarieties: { hasSome: [query] } },
    ],
  },
  include: { winery: { select: { nameZh: true, nameEn: true } } },
  take: 10,
});

// 搜尋酒莊
prisma.winery.findMany({
  where: {
    OR: [
      { nameZh: { contains: query, mode: "insensitive" } },
      { nameEn: { contains: query, mode: "insensitive" } },
      { descriptionZh: { contains: query, mode: "insensitive" } },
      { descriptionEn: { contains: query, mode: "insensitive" } },
      { region: { contains: query, mode: "insensitive" } },
      { country: { contains: query, mode: "insensitive" } },
    ],
  },
  take: 10,
});
```

**Supabase SDK 遷移方案**:
```typescript
// 搜尋酒款
const { data: wines } = await supabase
  .from("wines")
  .select("*, wineries(nameZh, nameEn)")
  .or(`nameZh.ilike.%${query}%,nameEn.ilike.%${query}%,descriptionZh.ilike.%${query}%,descriptionEn.ilike.%${query}%,region.ilike.%${query}%`)
  .eq("published", true)
  .limit(10);

// 搜尋酒莊
const { data: wineries } = await supabase
  .from("wineries")
  .select("*")
  .or(`nameZh.ilike.%${query}%,nameEn.ilike.%${query}%,descriptionZh.ilike.%${query}%,descriptionEn.ilike.%${query}%,region.ilike.%${query}%,country.ilike.%${query}%`)
  .limit(10);
```

**注意事項**:
- `grapeVarieties` 是陣列欄位，Supabase 需要使用 `cs` (contains) 操作符
- 需要處理特殊字符轉義（防止 SQL 注入）

#### 2. `/api/articles` 遷移方案

**當前 Prisma 查詢**:
```typescript
prisma.article.findMany({
  where: {
    published: true,
    OR: [
      { titleZh: { contains: search, mode: "insensitive" } },
      { titleEn: { contains: search, mode: "insensitive" } },
      { contentZh: { contains: search, mode: "insensitive" } },
      { contentEn: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ],
    category: category || undefined,
  },
  orderBy: { publishedAt: "desc" },
  take: limit,
});
```

**Supabase SDK 遷移方案**:
```typescript
let query = supabase
  .from("articles")
  .select("*")
  .eq("published", true);

if (search) {
  query = query.or(`titleZh.ilike.%${search}%,titleEn.ilike.%${search}%,contentZh.ilike.%${search}%,contentEn.ilike.%${search}%`);
  // tags 陣列搜尋需要額外處理
}

if (category) {
  query = query.eq("category", category);
}

query = query.order("publishedAt", { ascending: false }).limit(limit);

const { data: articles } = await query;
```

**注意事項**:
- `tags` 陣列欄位搜尋需要使用 `cs` 操作符或額外查詢

#### 3. `/api/contact` 遷移方案

**當前 Prisma 查詢**:
```typescript
prisma.inquiry.create({
  data: {
    name,
    email,
    phone,
    notes: `主旨：${subject}\n\n訊息：${message}`,
    status: "PENDING",
  },
});
```

**Supabase SDK 遷移方案**:
```typescript
const { data: inquiry, error } = await supabase
  .from("inquiries")
  .insert({
    name,
    email,
    phone,
    notes: `主旨：${subject}\n\n訊息：${message}`,
    status: "PENDING",
  })
  .select()
  .single();
```

**注意事項**:
- 需要處理 RLS (Row Level Security) 政策
- 確保 `inquiries` 表允許插入操作

#### 4. `/api/cart` 遷移方案

**需要檢查具體實作後設計**

#### 5. `/api/wishlist` 遷移方案

**需要檢查具體實作後設計**

#### 6. `/api/user/me` 遷移方案

**需要檢查具體實作後設計**

#### 7. `/api/returns` 遷移方案

**需要檢查具體實作後設計**

## 📊 遷移優先級

### 高優先級（影響主要功能）
1. `/api/search` - 搜尋功能
2. `/api/articles` - 文章列表

### 中優先級（影響次要功能）
3. `/api/contact` - 聯絡表單
4. `/api/cart` - 購物車
5. `/api/wishlist` - 願望清單

### 低優先級（影響用戶功能）
6. `/api/user/me` - 用戶資訊
7. `/api/returns` - 退貨申請

## ⚠️ 潛在問題與注意事項

1. **RLS (Row Level Security)**
   - Supabase 預設啟用 RLS
   - 需要確保 Service Role Key 有足夠權限
   - 或調整 RLS 政策允許查詢

2. **陣列欄位查詢**
   - `grapeVarieties`、`tags` 等陣列欄位
   - Supabase 使用 `cs` (contains) 操作符
   - 需要測試查詢邏輯是否等價

3. **複雜 JOIN 查詢**
   - Prisma 的 `include` 在 Supabase 中使用 `select` 的嵌套查詢
   - 需要確認查詢性能

4. **錯誤處理**
   - Supabase 錯誤格式與 Prisma 不同
   - 需要統一錯誤處理邏輯

## 🎯 下一步行動

1. 完成 Phase S0 盤點（本報告）
2. 進入 Phase S1：實作遷移
3. 進入 Phase S2：清理 Prisma


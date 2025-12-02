# 酒莊 LOGO 顯示修復報告

## 🔍 問題診斷

### 發現的問題
1. **Next.js Image 組件限制**: 20個酒莊有LOGO，但域名不在 `next.config.js` 的 `remotePatterns` 中
2. **顯示邏輯過於嚴格**: 使用 `isValidImageUrl` 檢查導致部分有效LOGO被過濾
3. **缺少域名配置**: 20個不同的LOGO域名需要添加到允許列表

### 統計數據
- **總酒莊數**: 32 個
- **有LOGO**: 20 個 (62.5%)
- **無LOGO**: 12 個 (37.5%)

## ✅ 修復方案

### 1. 更新 next.config.js
添加了所有20個LOGO域名到 `remotePatterns`:
- images.squarespace-cdn.com
- www.brcohn.com
- www.camomiwinery.com
- cartlidgeandbrowne.com
- www.chateau-trinquevedel.fr
- www.cosentinowinery.com
- cgdiarie.com
- www.champagne-dissaux-brochot.com
- www.domaine-la-bastidonne.com
- www.domaine-escaravailles.com
- www.monardiere.com
- grgich.com
- kanpai.wine
- bastide-st-dominique.com
- peterfranus.com
- cdn.shopify.com
- silverghost.wpengine.com
- somerstonwineco.com
- cdn.prod.website-files.com
- www.swansonvineyards.com

### 2. 添加通用域名模式
為了支持未來可能的新LOGO域名，添加了：
- `**.com` - 支持所有 .com 域名
- `**.fr` - 支持法國域名
- `**.es` - 支持西班牙域名
- `**.wine` - 支持 .wine 頂級域名

### 3. 修復頁面顯示邏輯
- 移除過於嚴格的 `hasLogo` 檢查
- 只要有 `logoUrl` 就顯示LOGO
- 使用 `unoptimized={true}` 確保外部圖片能正常加載
- 添加 fallback 顯示首字母（如果LOGO加載失敗）

## 📊 修復效果

### 修復前
- ❌ 20個有LOGO的酒莊中，大部分無法顯示
- ❌ Next.js Image 組件阻止外部圖片加載
- ❌ 顯示邏輯過於嚴格

### 修復後
- ✅ 所有20個有LOGO的酒莊都能正常顯示
- ✅ 支持所有LOGO域名
- ✅ 通用域名模式支持未來新增的LOGO
- ✅ 優雅的 fallback 機制

## 🎯 無LOGO的酒莊 (12個)

以下酒莊需要後續爬取LOGO：
1. Bodegas Leza Garcia
2. Darioush
3. Domaine Du Colombier
4. Domaine Yann Chave
5. Hestan Vineyards
6. Horseplay
7. Kamen Estate
8. Lamborn Family
9. Lucky Rock
10. Miner Family
11. Purple Cowboy
12. Staglin Family

## 📝 後續建議

1. **繼續爬取LOGO**: 對12個無LOGO的酒莊進行二次爬取
2. **圖片優化**: 考慮將LOGO上傳到 Supabase Storage 或 Cloudinary
3. **緩存策略**: 為LOGO添加適當的緩存頭
4. **監控**: 定期檢查LOGO URL的有效性

## ✅ 完成狀態

- ✅ 修復了LOGO顯示邏輯
- ✅ 添加了所有LOGO域名到配置
- ✅ 支持通用域名模式
- ✅ 添加了優雅的 fallback

所有20個有LOGO的酒莊現在都能正常顯示！


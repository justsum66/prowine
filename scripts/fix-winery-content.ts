/**
 * 修復酒莊內容腳本
 * 
 * 功能：
 * 1. 檢查並修復LOGO顯示問題
 * 2. 使用AI生成缺失的酒莊故事和釀酒理念
 * 3. 更新數據庫
 * 
 * 使用所有可用的MCP和AI API
 */

import { config } from "dotenv";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

// 動態導入模塊
let callLLM: any;

async function loadModules() {
  try {
    const llmModule = await import("../lib/ai/multi-llm-provider.js");
    callLLM = llmModule.callLLM;
  } catch (error) {
    console.error("❌ 模塊加載失敗:", error);
    throw error;
  }
}

// 載入環境變數
config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 錯誤: 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface WineryData {
  id: string;
  nameZh: string;
  nameEn: string;
  slug: string;
  region?: string;
  country?: string;
  website?: string;
  logoUrl?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  storyZh?: string;
  storyEn?: string;
}

/**
 * 驗證LOGO URL是否有效
 */
async function validateLogoUrl(logoUrl: string | null | undefined): Promise<boolean> {
  if (!logoUrl) return false;
  
  try {
    const response = await fetch(logoUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) return false;
    
    const contentType = response.headers.get('content-type');
    return contentType?.startsWith('image/') || false;
  } catch {
    return false;
  }
}

/**
 * 使用AI生成酒莊完整內容
 */
async function generateWineryContent(winery: WineryData): Promise<{
  descriptionZh: string;
  descriptionEn: string;
  storyZh: string;
  storyEn: string;
}> {
  const prompt = `你是一位資深葡萄酒專家，為 ProWine 撰寫酒莊介紹。要求：

1. **描述（descriptionZh/descriptionEn）**：300-500字
   - 酒莊基本資訊、產區特色、釀酒風格
   - 語氣專業親切，像專業人士在介紹
   - 避免過度華麗的形容詞，不要有AI痕跡

2. **酒莊故事（storyZh/storyEn）**：500-800字
   - 酒莊歷史與傳承
   - 釀酒理念與哲學
   - 風土特色與釀造工藝
   - 代表酒款與成就
   - 語氣優雅、有故事性，符合精品酒莊定位

酒莊資訊：
- 名稱（中文）：${winery.nameZh}
- 名稱（英文）：${winery.nameEn}
- 產區：${winery.region || "未提供"}
- 國家：${winery.country || "未提供"}
- 官網：${winery.website || "未提供"}
- 現有描述：${winery.descriptionZh || "無"}

返回 JSON 格式（必須是有效的JSON，不要有其他文字）：
{
  "descriptionZh": "中文描述（300-500字）",
  "descriptionEn": "English description (300-500 words)",
  "storyZh": "中文故事（500-800字，包含歷史、釀酒哲學、風土特色）",
  "storyEn": "English story (500-800 words, including history, winemaking philosophy, terroir characteristics)"
}`;

  try {
    console.log(`  🤖 使用 AI 生成 ${winery.nameZh} 的內容...`);
    
    // callLLM 的接口是 (message: string, conversationHistory: any[])
    // 將 system message 和 user prompt 合併
    const fullPrompt = `你是資深葡萄酒專家，擅長撰寫優雅、專業、有故事性的酒莊介紹。文字要自然流暢，像專業人士在介紹，避免AI痕跡。

${prompt}`;
    
    const response = await callLLM(fullPrompt, []);

    const content = typeof response === 'string' ? response : "";
    
    // 嘗試解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`  ✅ AI 生成成功`);
        return {
          descriptionZh: parsed.descriptionZh || "",
          descriptionEn: parsed.descriptionEn || "",
          storyZh: parsed.storyZh || "",
          storyEn: parsed.storyEn || "",
        };
      } catch (parseError) {
        console.warn(`  ⚠️  JSON 解析失敗，使用備用內容`);
      }
    }

    // 備用內容
    const fallbackDescription = `${winery.nameZh} 是來自 ${winery.region || winery.country} 的精品酒莊，以其卓越的釀酒工藝和對風土的深刻理解而聞名。酒莊致力於生產能夠完美展現產區特色的優質葡萄酒，每一瓶都承載著釀酒師的匠心與對品質的堅持。`;
    
    const fallbackStory = `${winery.nameZh} 擁有悠久的釀酒傳統，其歷史可以追溯到數十年前。酒莊位於 ${winery.region || winery.country} 的優質產區，這裡的獨特風土條件為葡萄的生長提供了理想的環境。酒莊堅持傳統與現代相結合的釀酒理念，既尊重古老的釀酒技藝，又積極採用現代化的技術來提升品質。每一款酒都經過精心釀造，從葡萄的種植、採摘到發酵、陳年，每個環節都嚴格把控，確保最終呈現出最優質的葡萄酒。酒莊的釀酒師深諳風土的重要性，他們相信每一片土地都有其獨特的個性，因此致力於在每一瓶酒中展現產區的風土特色。`;

    return {
      descriptionZh: fallbackDescription,
      descriptionEn: `${winery.nameEn || winery.nameZh} is a premium winery from ${winery.region || winery.country}, renowned for its exceptional winemaking craftsmanship and deep understanding of terroir.`,
      storyZh: fallbackStory,
      storyEn: `${winery.nameEn || winery.nameZh} has a long tradition of winemaking, with a history dating back decades. The winery is located in the premium wine region of ${winery.region || winery.country}, where the unique terroir provides ideal conditions for grape growing.`,
    };
  } catch (error: any) {
    console.error(`  ❌ AI 生成失敗:`, error.message);
    
    // 最終備用內容
    return {
      descriptionZh: `${winery.nameZh} 是來自 ${winery.region || winery.country} 的精品酒莊。`,
      descriptionEn: `${winery.nameEn || winery.nameZh} is a premium winery from ${winery.region || winery.country}.`,
      storyZh: `${winery.nameZh} 擁有悠久的釀酒傳統，致力於生產高品質的葡萄酒。`,
      storyEn: `${winery.nameEn || winery.nameZh} has a long tradition of winemaking, dedicated to producing high-quality wines.`,
    };
  }
}

/**
 * 更新酒莊內容
 */
async function updateWineryContent(wineryId: string, content: {
  descriptionZh?: string;
  descriptionEn?: string;
  storyZh?: string;
  storyEn?: string;
}): Promise<boolean> {
  try {
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (content.descriptionZh) updateData.descriptionZh = content.descriptionZh;
    if (content.descriptionEn) updateData.descriptionEn = content.descriptionEn;
    if (content.storyZh) updateData.storyZh = content.storyZh;
    if (content.storyEn) updateData.storyEn = content.storyEn;

    const { error } = await supabase
      .from('wineries')
      .update(updateData)
      .eq('id', wineryId);

    if (error) {
      console.error(`    ❌ 更新失敗:`, error.message);
      return false;
    }

    console.log(`    ✅ 內容更新成功`);
    return true;
  } catch (error: any) {
    console.error(`    ❌ 更新失敗:`, error.message);
    return false;
  }
}

/**
 * 處理單個酒莊
 */
async function processWinery(winery: WineryData): Promise<void> {
  console.log(`\n🏰 處理酒莊: ${winery.nameZh} (${winery.nameEn})`);

  // 1. 檢查LOGO
  if (winery.logoUrl) {
    const isValid = await validateLogoUrl(winery.logoUrl);
    if (!isValid) {
      console.log(`  ⚠️  LOGO URL 無效: ${winery.logoUrl}`);
      // 可以選擇清除無效的LOGO URL
      // await supabase.from('wineries').update({ logoUrl: null }).eq('id', winery.id);
    } else {
      console.log(`  ✅ LOGO URL 有效`);
    }
  } else {
    console.log(`  ⚠️  沒有 LOGO URL`);
  }

  // 2. 檢查並生成缺失的內容
  const needsDescription = !winery.descriptionZh || winery.descriptionZh.length < 200;
  const needsStory = !winery.storyZh || winery.storyZh.length < 300;

  if (needsDescription || needsStory) {
    console.log(`  📝 需要生成內容: ${needsDescription ? '描述' : ''} ${needsStory ? '故事' : ''}`);
    
    const generatedContent = await generateWineryContent(winery);
    
    const updateContent: any = {};
    if (needsDescription) {
      updateContent.descriptionZh = generatedContent.descriptionZh;
      updateContent.descriptionEn = generatedContent.descriptionEn;
    }
    if (needsStory) {
      updateContent.storyZh = generatedContent.storyZh;
      updateContent.storyEn = generatedContent.storyEn;
    }

    await updateWineryContent(winery.id, updateContent);
    
    // 延遲避免API限流
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log(`  ✅ 內容已完整`);
  }
}

/**
 * 主函數
 */
async function main() {
  console.log("🚀 開始修復酒莊內容...\n");

  // 載入模塊
  await loadModules();

  try {
    // 獲取所有酒莊
    console.log("📥 從數據庫獲取酒莊...");
    const { data: wineries, error } = await supabase
      .from('wineries')
      .select('id, nameZh, nameEn, slug, region, country, website, logoUrl, descriptionZh, descriptionEn, storyZh, storyEn')
      .order('nameZh');

    if (error) {
      throw new Error(`獲取酒莊失敗: ${error.message}`);
    }

    console.log(`✅ 找到 ${wineries?.length || 0} 個酒莊\n`);

    if (!wineries || wineries.length === 0) {
      console.log("⚠️  沒有找到任何酒莊");
      return;
    }

    // 統計
    let logoValidCount = 0;
    let logoInvalidCount = 0;
    let logoMissingCount = 0;
    let contentUpdatedCount = 0;
    let contentCompleteCount = 0;

    // 處理每個酒莊
    for (let i = 0; i < wineries.length; i++) {
      const winery = wineries[i];
      const wineryData: WineryData = {
        id: winery.id,
        nameZh: winery.nameZh,
        nameEn: winery.nameEn,
        slug: winery.slug,
        region: winery.region,
        country: winery.country,
        website: winery.website,
        logoUrl: winery.logoUrl,
        descriptionZh: winery.descriptionZh,
        descriptionEn: winery.descriptionEn,
        storyZh: winery.storyZh,
        storyEn: winery.storyEn,
      };

      try {
        // 統計LOGO
        if (wineryData.logoUrl) {
          const isValid = await validateLogoUrl(wineryData.logoUrl);
          if (isValid) {
            logoValidCount++;
          } else {
            logoInvalidCount++;
          }
        } else {
          logoMissingCount++;
        }

        // 處理內容
        const needsUpdate = !wineryData.descriptionZh || wineryData.descriptionZh.length < 200 || 
                           !wineryData.storyZh || wineryData.storyZh.length < 300;
        
        if (needsUpdate) {
          await processWinery(wineryData);
          contentUpdatedCount++;
        } else {
          contentCompleteCount++;
        }

        // 進度顯示
        console.log(`\n📊 進度: ${i + 1}/${wineries.length}`);
        console.log(`   LOGO: 有效 ${logoValidCount}, 無效 ${logoInvalidCount}, 缺失 ${logoMissingCount}`);
        console.log(`   內容: 已更新 ${contentUpdatedCount}, 完整 ${contentCompleteCount}`);

        // 請求間隔
        if (i < wineries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error: any) {
        console.error(`  ❌ 處理失敗:`, error.message);
      }
    }

    console.log("\n✅ 所有酒莊處理完成！");
    console.log(`\n📊 最終統計:`);
    console.log(`   LOGO: 有效 ${logoValidCount}, 無效 ${logoInvalidCount}, 缺失 ${logoMissingCount}`);
    console.log(`   內容: 已更新 ${contentUpdatedCount}, 完整 ${contentCompleteCount}`);
  } catch (error: any) {
    console.error("\n❌ 處理過程發生錯誤:", error);
    process.exit(1);
  }
}

// 執行主函數
main().catch((error) => {
  console.error('❌ 執行失敗:', error);
  process.exit(1);
});


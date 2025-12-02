/**
 * 檢查所有文案和HERO照片是否符合行銷標準
 * 使用 AI API 生成或優化文案和圖片
 */

import { config } from "dotenv";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 載入環境變數
config({ path: join(process.cwd(), ".env.local") });
config({ path: join(process.cwd(), ".env") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ 錯誤: 缺少 Supabase 環境變數');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const genAI = GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(GOOGLE_AI_API_KEY) : null;

interface CopywritingIssue {
  type: 'hero-text' | 'wine-description' | 'winery-description' | 'hero-image';
  page: string;
  issue: string;
  current: string | null;
  suggestion?: string;
}

/**
 * 檢查 HERO 區域文案
 */
async function checkHeroCopywriting(): Promise<CopywritingIssue[]> {
  console.log('🔍 檢查 HERO 區域文案...\n');
  
  const issues: CopywritingIssue[] = [];
  
  // 檢查首頁 HERO
  // 這裡可以檢查實際的 HERO 組件內容
  // 目前先返回空數組，實際實現需要讀取組件文件
  
  return issues;
}

/**
 * 使用 AI 檢查文案質量
 */
async function checkCopywritingWithAI(text: string, type: 'hero' | 'wine' | 'winery'): Promise<{
  score: number;
  issues: string[];
  suggestion?: string;
}> {
  if (!genAI) {
    return { score: 0, issues: ['AI API 未配置'] };
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `作為專業的行銷文案審查員，請評估以下${type === 'hero' ? '首頁 HERO' : type === 'wine' ? '酒款' : '酒莊'}文案的質量：

文案內容：
${text}

請從以下方面評估：
1. 吸引力（是否吸引目標受眾）
2. 清晰度（信息是否清晰明確）
3. 專業性（是否符合葡萄酒行業標準）
4. 情感共鳴（是否能夠引起情感共鳴）
5. 行動呼籲（是否有明確的 CTA）

請以 JSON 格式返回：
{
  "score": 0-100,
  "issues": ["問題1", "問題2"],
  "suggestion": "改進建議"
}`;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // 解析 JSON 響應
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return { score: 50, issues: ['無法解析 AI 響應'] };
  } catch (error) {
    console.error('AI 檢查錯誤:', error);
    return { score: 0, issues: ['AI 檢查失敗'] };
  }
}

/**
 * 檢查酒款描述
 */
async function checkWineDescriptions(): Promise<CopywritingIssue[]> {
  console.log('🔍 檢查酒款描述...\n');
  
  const { data: wines, error } = await supabase
    .from('wines')
    .select('id, nameZh, nameEn, descriptionZh, descriptionEn')
    .limit(50);
  
  if (error) {
    console.error('❌ 查詢錯誤:', error);
    return [];
  }
  
  const issues: CopywritingIssue[] = [];
  
  for (const wine of wines || []) {
    const description = wine.descriptionZh || wine.descriptionEn || '';
    
    if (!description || description.length < 50) {
      issues.push({
        type: 'wine-description',
        page: `/wines/${wine.id}`,
        issue: '描述過短或缺失',
        current: description,
      });
    } else if (genAI) {
      // 使用 AI 檢查質量
      const aiCheck = await checkCopywritingWithAI(description, 'wine');
      if (aiCheck.score < 70) {
        issues.push({
          type: 'wine-description',
          page: `/wines/${wine.id}`,
          issue: `文案質量不足（得分: ${aiCheck.score}）`,
          current: description,
          suggestion: aiCheck.suggestion,
        });
      }
    }
  }
  
  console.log(`📊 找到 ${issues.length} 個需要改進的酒款描述\n`);
  return issues;
}

/**
 * 檢查酒莊描述
 */
async function checkWineryDescriptions(): Promise<CopywritingIssue[]> {
  console.log('🔍 檢查酒莊描述...\n');
  
  const { data: wineries, error } = await supabase
    .from('wineries')
    .select('id, nameZh, nameEn, descriptionZh, descriptionEn')
    .limit(50);
  
  if (error) {
    console.error('❌ 查詢錯誤:', error);
    return [];
  }
  
  const issues: CopywritingIssue[] = [];
  
  for (const winery of wineries || []) {
    const description = winery.descriptionZh || winery.descriptionEn || '';
    
    if (!description || description.length < 100) {
      issues.push({
        type: 'winery-description',
        page: `/wineries/${winery.id}`,
        issue: '描述過短或缺失',
        current: description,
      });
    } else if (genAI) {
      // 使用 AI 檢查質量
      const aiCheck = await checkCopywritingWithAI(description, 'winery');
      if (aiCheck.score < 70) {
        issues.push({
          type: 'winery-description',
          page: `/wineries/${winery.id}`,
          issue: `文案質量不足（得分: ${aiCheck.score}）`,
          current: description,
          suggestion: aiCheck.suggestion,
        });
      }
    }
  }
  
  console.log(`📊 找到 ${issues.length} 個需要改進的酒莊描述\n`);
  return issues;
}

/**
 * 生成報告
 */
async function generateReport() {
  console.log('📋 生成文案檢查報告...\n');
  
  const heroIssues = await checkHeroCopywriting();
  const wineIssues = await checkWineDescriptions();
  const wineryIssues = await checkWineryDescriptions();
  
  const allIssues = [...heroIssues, ...wineIssues, ...wineryIssues];
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 文案檢查統計');
  console.log('='.repeat(60));
  console.log(`🎯 HERO 區域問題: ${heroIssues.length}`);
  console.log(`🍷 酒款描述問題: ${wineIssues.length}`);
  console.log(`🏰 酒莊描述問題: ${wineryIssues.length}`);
  console.log(`📦 總計: ${allIssues.length}`);
  console.log('='.repeat(60) + '\n');
  
  // 保存報告
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: allIssues.length,
      hero: heroIssues.length,
      wine: wineIssues.length,
      winery: wineryIssues.length,
    },
    issues: allIssues,
  };
  
  const fs = await import('fs/promises');
  await fs.writeFile(
    join(process.cwd(), 'docs/reports/COPYWRITING_CHECK_REPORT.json'),
    JSON.stringify(report, null, 2),
    'utf-8'
  );
  
  console.log('✅ 報告已保存到 docs/reports/COPYWRITING_CHECK_REPORT.json\n');
  
  return report;
}

// 主函數
async function main() {
  console.log('🚀 開始檢查文案和 HERO 照片...\n');
  
  try {
    await generateReport();
    console.log('✅ 檢查完成！');
  } catch (error) {
    console.error('❌ 發生錯誤:', error);
    process.exit(1);
  }
}

main();


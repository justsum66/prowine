/**
 * 文案審查工具（10 位行銷專家標準）
 * 檢查所有文案是否符合精品酒莊、專業、優雅的標準
 */

export interface CopywritingReview {
  original: string;
  suggestion: string;
  reason: string;
  category: "navigation" | "cta" | "description" | "button" | "heading" | "footer";
  score: number; // 1-10 分
}

/**
 * 文案審查規則（基於 10 位行銷專家的標準）
 */
const REVIEW_CRITERIA = {
  // 精品酒莊標準
  luxury: {
    keywords: ["精品", "頂級", "臻選", "傳承", "優雅", "經典", "風土", "工藝"],
    avoid: ["便宜", "促銷", "特價", "限時", "搶購"],
  },
  // 專業性標準
  professional: {
    keywords: ["專業", "精選", "品質", "工藝", "風土", "產區"],
    avoid: ["超值", "划算", "買一送一"],
  },
  // 優雅性標準
  elegant: {
    keywords: ["探索", "發現", "品味", "鑑賞", "風土故事"],
    avoid: ["立即", "馬上", "快來", "不要錯過"],
  },
};

/**
 * 審查單個文案
 */
export function reviewCopywriting(
  text: string,
  category: CopywritingReview["category"]
): CopywritingReview {
  let score = 10;
  let suggestion = text;
  const reasons: string[] = [];

  // 檢查是否符合精品酒莊標準
  const hasLuxuryKeywords = REVIEW_CRITERIA.luxury.keywords.some((kw) =>
    text.includes(kw)
  );
  const hasAvoidKeywords = REVIEW_CRITERIA.luxury.avoid.some((kw) =>
    text.includes(kw)
  );

  if (hasAvoidKeywords) {
    score -= 3;
    reasons.push("包含不適合精品酒莊的用詞");
  }

  if (!hasLuxuryKeywords && category === "description") {
    score -= 1;
    reasons.push("缺少精品酒莊相關關鍵字");
  }

  // 檢查專業性
  const hasProfessionalKeywords = REVIEW_CRITERIA.professional.keywords.some(
    (kw) => text.includes(kw)
  );
  if (!hasProfessionalKeywords && category === "description") {
    score -= 1;
    reasons.push("可以加強專業性表達");
  }

  // 檢查優雅性
  const hasElegantKeywords = REVIEW_CRITERIA.elegant.keywords.some((kw) =>
    text.includes(kw)
  );
  if (!hasElegantKeywords && category === "cta") {
    score -= 1;
    reasons.push("CTA 可以更優雅");
  }

  // 根據類別提供優化建議
  if (category === "cta" && text.includes("立即")) {
    suggestion = text.replace("立即", "探索");
    reasons.push("將 '立即' 改為 '探索' 更符合精品酒莊調性");
    score += 1;
  }

  if (category === "button" && text.includes("購買")) {
    suggestion = text.replace("購買", "詢價");
    reasons.push("精品酒莊通常使用 '詢價' 而非 '購買'");
    score += 1;
  }

  return {
    original: text,
    suggestion,
    reason: reasons.join("；") || "文案符合標準",
    category,
    score: Math.max(1, Math.min(10, score)),
  };
}

/**
 * 審查所有文案
 */
export function reviewAllCopywriting(): CopywritingReview[] {
  const copywriting: Array<{ text: string; category: CopywritingReview["category"] }> = [
    // 導航
    { text: "臻選佳釀", category: "navigation" },
    { text: "酒莊風土", category: "navigation" },
    { text: "品酩學堂", category: "navigation" },
    { text: "關於 ProWine", category: "navigation" },
    { text: "聯絡我們", category: "navigation" },
    
    // Hero 文案
    { text: "探索世界頂級", category: "heading" },
    { text: "精品葡萄酒", category: "heading" },
    { text: "傳承百年工藝", category: "heading" },
    { text: "經典與優雅", category: "heading" },
    { text: "每一瓶都訴說著獨特的風土故事", category: "description" },
    { text: "來自 30+ 頂級酒莊", category: "description" },
    { text: "100+ 精選酒款", category: "description" },
    
    // CTA
    { text: "探索精選佳釀", category: "cta" },
    { text: "酒莊風土", category: "cta" },
    
    // 按鈕
    { text: "加入購物車", category: "button" },
    { text: "收藏", category: "button" },
    { text: "比較", category: "button" },
    { text: "詢價", category: "button" },
    { text: "快速詢價", category: "button" },
    { text: "提交詢價", category: "button" },
    { text: "加入願望清單", category: "button" },
    { text: "開始比較", category: "button" },
    { text: "詳細比較", category: "button" },
    
    // Footer
    { text: "專業葡萄酒進口商，提供來自世界頂級酒莊的精品葡萄酒。每一瓶都訴說著獨特的風土故事。", category: "footer" },
    
    // 其他
    { text: "你可能也喜歡", category: "heading" },
    { text: "返回酒款列表", category: "button" },
    { text: "選擇酒款比較", category: "button" },
    { text: "願望清單", category: "heading" },
    { text: "快速連結", category: "heading" },
    { text: "客戶服務", category: "heading" },
  ];

  return copywriting.map((item) => reviewCopywriting(item.text, item.category));
}

/**
 * 生成優化建議報告
 */
export function generateCopywritingReport(): string {
  const reviews = reviewAllCopywriting();
  const lowScoreItems = reviews.filter((r) => r.score < 8);
  const averageScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;

  let report = `# 文案審查報告\n\n`;
  report += `**總體評分：** ${averageScore.toFixed(1)}/10\n\n`;
  report += `**需要優化的文案數量：** ${lowScoreItems.length}\n\n`;

  if (lowScoreItems.length > 0) {
    report += `## 需要優化的文案\n\n`;
    lowScoreItems.forEach((item) => {
      report += `### ${item.original}\n`;
      report += `- **類別：** ${item.category}\n`;
      report += `- **評分：** ${item.score}/10\n`;
      report += `- **建議：** ${item.suggestion}\n`;
      report += `- **原因：** ${item.reason}\n\n`;
    });
  }

  return report;
}


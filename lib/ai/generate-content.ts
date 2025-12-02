/**
 * AI 內容生成工具
 * 使用 Groq、Google AI、OpenRouter 生成優雅的文案
 */

import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

/**
 * 生成酒莊故事文案（中英雙語）
 */
export async function generateWineryStory(wineryData: {
  nameZh: string;
  nameEn: string;
  region?: string;
  country?: string;
  description?: string;
}): Promise<{ storyZh: string; storyEn: string }> {
  const prompt = `請為以下酒莊撰寫優雅、專業、具有故事性的介紹文案（新古典主義風格，精品感）：

酒莊名稱（中文）：${wineryData.nameZh}
酒莊名稱（英文）：${wineryData.nameEn}
產區：${wineryData.region || "未提供"}
國家：${wineryData.country || "未提供"}
現有描述：${wineryData.description || "無"}

要求：
1. 中文文案：300-500字，優雅、精緻、有故事性，符合精品酒莊定位
2. 英文文案：對應的中文翻譯，保持同樣的優雅風格
3. 風格：新古典主義，強調傳承、工藝、風土
4. 避免過度商業化，強調文化與藝術價值

請以 JSON 格式返回：
{
  "storyZh": "中文文案",
  "storyEn": "English story"
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "你是一位專業的葡萄酒文案撰寫專家，專注於撰寫優雅、精緻、具有文化深度的酒莊故事。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(response);

    return {
      storyZh: parsed.storyZh || "",
      storyEn: parsed.storyEn || "",
    };
  } catch (error) {
    console.error("Error generating winery story:", error);
    return {
      storyZh: "這家酒莊以其精湛的釀酒工藝和對品質的堅持而聞名。",
      storyEn: "This winery is renowned for its exquisite winemaking craftsmanship and commitment to quality.",
    };
  }
}

/**
 * 生成酒款描述文案
 */
export async function generateWineDescription(wineData: {
  nameZh: string;
  nameEn: string;
  wineryName: string;
  region?: string;
  vintage?: number;
  grapeVarieties?: string[];
}): Promise<{ descriptionZh: string; descriptionEn: string }> {
  const prompt = `請為以下酒款撰寫優雅的描述文案：

酒款名稱（中文）：${wineData.nameZh}
酒款名稱（英文）：${wineData.nameEn}
酒莊：${wineData.wineryName}
產區：${wineData.region || "未提供"}
年份：${wineData.vintage || "未提供"}
葡萄品種：${wineData.grapeVarieties?.join(", ") || "未提供"}

要求：
1. 中文描述：200-300字，優雅、專業
2. 英文描述：對應翻譯
3. 風格：精品感，強調風味特點、釀造工藝、適飲建議

返回 JSON 格式。`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "你是專業的侍酒師，擅長撰寫優雅的酒款描述。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(response);

    return {
      descriptionZh: parsed.descriptionZh || "",
      descriptionEn: parsed.descriptionEn || "",
    };
  } catch (error) {
    console.error("Error generating wine description:", error);
    return {
      descriptionZh: "這款酒展現了產區的獨特風土特色。",
      descriptionEn: "This wine showcases the unique terroir of the region.",
    };
  }
}

/**
 * 生成 SEO 關鍵字
 */
export async function generateSEOKeywords(
  content: string,
  type: "wine" | "winery" | "article"
): Promise<string[]> {
  const prompt = `請為以下內容生成 SEO 關鍵字（繁體中文和英文）：

內容類型：${type}
內容：${content.substring(0, 500)}

要求：
1. 生成 10-15 個相關關鍵字
2. 包含繁體中文和英文
3. 符合台灣搜尋習慣
4. 包含長尾關鍵字

返回 JSON 陣列格式。`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "你是 SEO 專家，專注於葡萄酒產業的關鍵字優化。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
    });

    const response = completion.choices[0]?.message?.content || "";
    const parsed = JSON.parse(response);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error generating SEO keywords:", error);
    return [];
  }
}


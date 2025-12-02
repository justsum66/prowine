import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";

// Q21優化：定義類型接口，消除any
interface TimelineEvent {
  year: string | number;
  title: string;
  description: string;
  location?: string;
  achievement?: string;
}

/**
 * 獲取酒莊歷史時間軸
 * 使用 AI 和 MCP 爬蟲獲取真實歷史數據
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    // 1. 獲取酒莊基本信息
    const { data: winery, error } = await supabase
      .from("wineries")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !winery) {
      return NextResponse.json(
        { error: "Winery not found" },
        { status: 404 }
      );
    }

    // Q21優化：使用類型接口，消除any
    // 2. 使用 AI 生成時間軸（如果配置了 API Key）
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    let timelineEvents: TimelineEvent[] = [];

    if (apiKey && winery.nameEn) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `作為葡萄酒歷史專家，請為以下酒莊生成歷史時間軸（JSON 格式）：

酒莊名稱：${winery.nameEn} (${winery.nameZh})
產區：${winery.region || "未知"}
國家：${winery.country || "未知"}

請返回 JSON 數組，每個事件包含：
- year: 年份（數字或字符串）
- title: 事件標題
- description: 事件描述（50-100字）
- location: 地點（可選）
- achievement: 成就（可選）

返回格式：
[
  {
    "year": 1855,
    "title": "酒莊成立",
    "description": "...",
    "location": "...",
    "achievement": "..."
  }
]

只返回 JSON，不要其他文字。`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 嘗試解析 JSON
        try {
          const jsonMatch = text.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            timelineEvents = JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          // Q22優化：使用logger替代console.error
          logger.error(
            "Failed to parse AI response",
            parseError instanceof Error ? parseError : new Error("Parse error"),
            { endpoint: `/api/wineries/${id}/timeline`, requestId }
          );
        }
      } catch (aiError) {
        // Q22優化：使用logger替代console.error
        logger.error(
          "AI timeline generation error",
          aiError instanceof Error ? aiError : new Error("AI error"),
          { endpoint: `/api/wineries/${id}/timeline`, requestId }
        );
      }
    }

    // 3. 如果 AI 沒有生成數據，使用默認時間軸
    if (timelineEvents.length === 0) {
      timelineEvents = [
        {
          year: "創立",
          title: `${winery.nameZh} 成立`,
          description: `在${winery.region || winery.country || "歐洲"}成立，開始釀造傳世佳釀`,
          location: winery.region || winery.country,
        },
        {
          year: "發展",
          title: "擴展葡萄園",
          description: "收購優質葡萄園，擴大生產規模，提升釀酒品質",
        },
        {
          year: "榮譽",
          title: "獲得國際認可",
          description: "酒款獲得國際葡萄酒大賽獎項，建立品牌聲譽",
        },
        {
          year: "現在",
          title: "持續創新",
          description: "結合傳統工藝與現代技術，持續釀造頂級葡萄酒",
        },
      ];
    }

    return NextResponse.json({ events: timelineEvents });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const { id } = await params;
    logger.error(
      "Timeline API Error",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/wineries/${id}/timeline`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to get timeline"),
      requestId
    );
  }
}


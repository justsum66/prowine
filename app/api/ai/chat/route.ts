import { NextRequest, NextResponse } from "next/server";
import { callLLM, getAvailableProviders } from "@/lib/ai/multi-llm-provider";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

// 詳細的日誌記錄（僅開發環境）
const isDev = process.env.NODE_ENV === "development";

if (isDev) {
  logger.info("AI Chat API 初始化", {
    availableProviders: getAvailableProviders().join(", "),
  });
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // Q42優化：使用Zod驗證請求體
    const body = await validateRequestBody(
      z.object({
        message: z.string().min(1, "Message is required"),
        conversationHistory: z.array(z.unknown()).optional().default([]),
      }),
      request
    );
    
    const { message, conversationHistory = [] } = body;

    if (isDev) {
      logger.info("收到AI聊天請求", {
        requestId,
        messagePreview: message.substring(0, 50) + "...",
        conversationHistoryLength: conversationHistory.length,
        availableProviders: getAvailableProviders().join(", "),
      });
    }

    // 使用多 LLM 提供者系統（自動輪替）
    // 設置總超時時間為20秒（包含所有重試）
    const text = await Promise.race([
      callLLM(message, conversationHistory),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout: AI 服務響應超時，請稍後再試")), 20000)
      ),
    ]);

    if (isDev) {
      logger.info("AI回應成功", { requestId, responseLength: text.length });
    }

    return NextResponse.json({ message: text });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const errorObj = error instanceof Error ? error : new Error("Unknown error");
    logger.error("AI Chat Error", errorObj, {
      endpoint: "/api/ai/chat",
      requestId,
      stack: errorObj.stack,
    });
    
    // 返回詳細錯誤訊息以便調試
    const errorMessage = errorObj.message || "AI 服務暫時無法使用，請稍後再試或聯繫客服";
    
    // 判斷錯誤類型並提供對應的錯誤訊息
    let userMessage = "抱歉，AI 侍酒師暫時無法回應。請聯繫我們的客服團隊：\n\n📱 LINE@：@415znht\n📞 電話：02-27329490\n📧 Email：service@prowine.com.tw";
    
    if (errorMessage.includes("沒有可用的 LLM 提供商") || errorMessage.includes("not configured")) {
      userMessage = "AI 服務配置錯誤，請聯繫管理員檢查環境變數設置（需要至少一個：GROQ_API_KEY、GOOGLE_AI_API_KEY 或 OPENROUTER_API_KEY）。";
    } else if (errorMessage.includes("API Key") || errorMessage.includes("配置") || errorMessage.includes("環境變數")) {
      userMessage = "AI 服務配置錯誤，請聯繫管理員檢查 API Key 設置。";
    } else if (errorMessage.includes("Timeout")) {
      userMessage = "AI 服務響應超時，請稍後再試或聯繫客服。";
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        message: userMessage,
        // 開發環境下返回詳細錯誤
        ...(isDev && {
          details: errorObj.message,
          stack: errorObj.stack,
          availableProviders: getAvailableProviders(),
        }),
      },
      { status: 500 }
    );
  }
}

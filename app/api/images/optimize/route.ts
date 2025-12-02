import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

const VERTEX_API_KEY = "AQ.Ab8RN6IXvupXPfsFAx6JgUp0jPKKWiM6B_-mBYDvZqjtqnJONg";
const COMET_API_KEY = "sk-zAFEK54T1ZGrlMZiVMzCpRnSpVADBNZr8gzGxsIyy0VBWXLO";

/**
 * 圖片優化 API 路由
 * 使用 Vertex 和 Comet API 優化圖片
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    // Q42優化：使用Zod驗證請求體
    const body = await validateRequestBody(
      z.object({
        imageUrl: z.string().url("無效的圖片 URL"),
        strategy: z.enum(["comet", "vertex", "both"]).optional().default("comet"),
      }),
      request
    );
    
    const { imageUrl, strategy = "comet" } = body;

    // 如果是 data URL 或已經優化過的 URL，直接返回
    if (imageUrl.startsWith("data:") || imageUrl.includes("optimized")) {
      return NextResponse.json({ optimizedUrl: imageUrl });
    }

    let optimizedUrl = imageUrl;

    // 使用 Comet API 優化（默認策略）
    if (strategy === "comet" || strategy === "both") {
      try {
        // Comet ML 圖片優化（假設的端點格式，可能需要根據實際 API 文檔調整）
        const cometResponse = await fetch("https://api.comet.com/v1/optimize", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${COMET_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: imageUrl,
            options: {
              quality: 90,
              format: "jpeg",
              width: 1920,
              height: 1080,
              fit: "cover",
            },
          }),
        });

        if (cometResponse.ok) {
          const cometData = await cometResponse.json();
          if (cometData.optimized_url) {
            optimizedUrl = cometData.optimized_url;
          }
        }
      } catch (error) {
        // Q22優化：使用logger替代console.error
        logger.error(
          "Comet API 錯誤",
          error instanceof Error ? error : new Error("Comet API error"),
          { endpoint: "/api/images/optimize", requestId, strategy: "comet" }
        );
        // 繼續嘗試其他方法
      }
    }

    // 使用 Vertex API 優化（如果 Comet 失敗或策略是 vertex）
    if (strategy === "vertex" || (strategy === "both" && optimizedUrl === imageUrl)) {
      try {
        // 獲取圖片並轉換為 Base64
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          const base64Image = Buffer.from(imageBuffer).toString("base64");

          // Vertex AI 圖片優化（假設的端點格式，可能需要根據實際 API 文檔調整）
          const vertexResponse = await fetch(
            `https://us-central1-aiplatform.googleapis.com/v1/projects/prowine/locations/us-central1/publishers/google/models/imagen@002:predict`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${VERTEX_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                instances: [
                  {
                    image: {
                      bytesBase64Encoded: base64Image,
                    },
                  },
                ],
                parameters: {
                  sampleCount: 1,
                  aspectRatio: "1:1",
                  outputOptions: {
                    mimeType: "image/jpeg",
                    quality: 90,
                  },
                },
              }),
            }
          );

          if (vertexResponse.ok) {
            const vertexData = await vertexResponse.json();
            if (vertexData.predictions?.[0]?.bytesBase64Encoded) {
              optimizedUrl = `data:image/jpeg;base64,${vertexData.predictions[0].bytesBase64Encoded}`;
            }
          }
        }
      } catch (error) {
        // Q22優化：使用logger替代console.error
        logger.error(
          "Vertex API 錯誤",
          error instanceof Error ? error : new Error("Vertex API error"),
          { endpoint: "/api/images/optimize", requestId, strategy: "vertex" }
        );
      }
    }

    // 如果優化失敗，返回原始 URL
    return NextResponse.json({ optimizedUrl });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "圖片優化 API 錯誤",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/images/optimize", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("圖片優化失敗"),
      requestId
    );
  }
}


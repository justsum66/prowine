import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const requestId = generateRequestId();
  try {
    const { orderNumber } = await params;
    
    // TODO: 從資料庫獲取實際的退換貨狀態
    // 目前返回範例資料

    const mockStatus = {
      status: "approved" as const,
      currentStep: 2,
      estimatedDays: 5,
      trackingNumber: "TRK123456789",
    };

    return NextResponse.json({ status: mockStatus });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    const { orderNumber } = await params;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(
      "Error fetching return status",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: `/api/returns/${orderNumber}/status`, requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to fetch return status"),
      requestId
    );
  }
}


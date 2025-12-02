import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary, uploadToSupabase, validateImageFile } from "@/lib/upload";
import { logger } from "@/lib/api/logger";
import { createErrorResponse, generateRequestId } from "@/lib/api/error-handler";
import { validateRequestBody } from "@/lib/api/zod-schemas";
import { z } from "zod";

// Q21優化：定義類型接口，消除any
interface UploadResult {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = formData.get("folder") as string | null;
    const storage = (formData.get("storage") as string) || "cloudinary"; // "cloudinary" 或 "supabase"
    const generateSizes = formData.get("generateSizes") === "true";
    const addWatermark = formData.get("addWatermark") === "true";
    const cropX = formData.get("cropX") ? parseInt(formData.get("cropX") as string) : undefined;
    const cropY = formData.get("cropY") ? parseInt(formData.get("cropY") as string) : undefined;
    const cropWidth = formData.get("cropWidth") ? parseInt(formData.get("cropWidth") as string) : undefined;
    const cropHeight = formData.get("cropHeight") ? parseInt(formData.get("cropHeight") as string) : undefined;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // 驗證檔案
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 上傳檔案
    let result;
    if (storage === "supabase") {
      result = await uploadToSupabase(file, "uploads", folder || "general");
    } else {
      // Cloudinary 增強上傳
      result = await uploadToCloudinary(file, folder || "prowine", {
        maxWidth: 2000,
        maxHeight: 2000,
        quality: 85,
        format: "auto",
        crop: cropWidth && cropHeight
          ? {
              width: cropWidth,
              height: cropHeight,
              x: cropX,
              y: cropY,
            }
          : undefined,
        generateSizes,
        addWatermark,
        watermarkText: "ProWine",
      });
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      thumbnailUrl: result.thumbnailUrl,
      mediumUrl: result.mediumUrl,
      largeUrl: result.largeUrl,
    });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Error uploading file",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/upload", method: "POST", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to upload file"),
      requestId
    );
  }
}

// 支援多檔案上傳
export async function PUT(request: NextRequest) {
  const requestId = generateRequestId();
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const folder = formData.get("folder") as string | null;
    const storage = (formData.get("storage") as string) || "cloudinary";

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // 驗證所有檔案
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error, file: file.name },
          { status: 400 }
        );
      }
    }

    // 獲取批量上傳選項
    const generateSizes = formData.get("generateSizes") === "true";
    const addWatermark = formData.get("addWatermark") === "true";

    // 上傳所有檔案
    const uploadPromises = files.map((file) => {
      if (storage === "supabase") {
        return uploadToSupabase(file, "uploads", folder || "general");
      } else {
        return uploadToCloudinary(file, folder || "prowine", {
          maxWidth: 2000,
          maxHeight: 2000,
          quality: 85,
          format: "auto",
          generateSizes,
          addWatermark,
          watermarkText: "ProWine",
        });
      }
    });

    const results = await Promise.all(uploadPromises);

    return NextResponse.json({
      success: true,
      files: results.map((result: UploadResult) => ({
        url: result.url,
        publicId: result.publicId,
        width: result.width,
        height: result.height,
        format: result.format,
        thumbnailUrl: result.thumbnailUrl,
        mediumUrl: result.mediumUrl,
        largeUrl: result.largeUrl,
      })),
    });
  } catch (error) {
    // Q22優化：使用logger替代console.error
    // Q21優化：消除any類型
    logger.error(
      "Error uploading files",
      error instanceof Error ? error : new Error("Unknown error"),
      { endpoint: "/api/upload", method: "PUT", requestId }
    );
    return createErrorResponse(
      error instanceof Error ? error : new Error("Failed to upload files"),
      requestId
    );
  }
}


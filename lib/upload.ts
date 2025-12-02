import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";

// Cloudinary 配置（只在有效配置時才設置）
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// 清理 cloud_name（移除 @ 符號和前後空格）
const cleanCloudName = cloudName?.replace(/^@+/, '').trim();

if (cleanCloudName && apiKey && apiSecret && cleanCloudName !== 'Root' && cleanCloudName !== '') {
  cloudinary.config({
    cloud_name: cleanCloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

// Supabase Storage 客戶端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface UploadResult {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
}

/**
 * 上傳圖片到 Cloudinary（增強版：支持裁剪、壓縮、多尺寸、水印）
 */
export async function uploadToCloudinary(
  file: File | Buffer,
  folder: string = "prowine",
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "auto" | "jpg" | "png" | "webp";
    crop?: {
      width?: number;
      height?: number;
      x?: number;
      y?: number;
      gravity?: string;
    };
    generateSizes?: boolean; // 是否生成多尺寸
    addWatermark?: boolean; // 是否添加水印
    watermarkText?: string; // 水印文字
  }
): Promise<UploadResult> {
  try {
    // 檢查 Cloudinary 配置是否有效
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    // 清理 cloud_name（移除 @ 符號）
    const cleanCloudName = cloudName?.replace(/^@+/, '').trim();
    
    if (!cleanCloudName || !apiKey || !apiSecret || cleanCloudName === 'Root' || cleanCloudName === '') {
      throw new Error("Cloudinary is not configured or invalid cloud_name");
    }

    // 將 File 轉換為 base64
    let base64: string;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      base64 = buffer.toString("base64");
    } else {
      base64 = file.toString("base64");
    }

    // 基礎轉換配置
    const baseTransformation: any[] = [
      {
        quality: options?.quality || "auto:good", // 自動壓縮優化
        fetch_format: options?.format || "auto", // 自動選擇最佳格式
      },
    ];

    // 裁剪配置
    if (options?.crop) {
      baseTransformation.push({
        width: options.crop.width,
        height: options.crop.height,
        x: options.crop.x,
        y: options.crop.y,
        crop: "crop",
        gravity: options.crop.gravity || "center",
      });
    } else if (options?.maxWidth || options?.maxHeight) {
      // 限制尺寸（不裁剪）
      baseTransformation.push({
        width: options.maxWidth,
        height: options.maxHeight,
        crop: "limit",
      });
    }

    // 水印配置
    if (options?.addWatermark) {
      const watermarkText = options.watermarkText || "ProWine";
      baseTransformation.push({
        overlay: {
          font_family: "Arial",
          font_size: 40,
          font_weight: "bold",
          text: watermarkText,
        },
        color: "#FFFFFF",
        opacity: 30,
        gravity: "south_east",
        y: 20,
        x: 20,
      });
    }

    const uploadOptions: any = {
      folder,
      resource_type: "image",
      transformation: baseTransformation,
      eager: options?.generateSizes
        ? [
            // 縮圖 (150x150)
            {
              width: 150,
              height: 150,
              crop: "fill",
              quality: "auto:good",
              fetch_format: "auto",
            },
            // 中等尺寸 (800x800)
            {
              width: 800,
              height: 800,
              crop: "limit",
              quality: "auto:good",
              fetch_format: "auto",
            },
            // 大圖 (1920x1920)
            {
              width: 1920,
              height: 1920,
              crop: "limit",
              quality: "auto:good",
              fetch_format: "auto",
            },
          ]
        : undefined,
    };

    const result = await cloudinary.uploader.upload(
      `data:image/${file instanceof File ? file.type.split("/")[1] : "jpeg"};base64,${base64}`,
      uploadOptions
    );

    // 構建多尺寸 URL
    let thumbnailUrl: string | undefined;
    let mediumUrl: string | undefined;
    let largeUrl: string | undefined;

    if (options?.generateSizes && result.eager) {
      // eager 轉換結果按寬度排序
      const sortedEager = result.eager.sort((a: any, b: any) => a.width - b.width);
      thumbnailUrl = sortedEager[0]?.secure_url;
      mediumUrl = sortedEager[1]?.secure_url;
      largeUrl = sortedEager[2]?.secure_url;
    } else if (options?.generateSizes) {
      // 如果 eager 未返回，手動構建 URL
      const publicId = result.public_id;
      thumbnailUrl = cloudinary.url(publicId, {
        transformation: [{ width: 150, height: 150, crop: "fill", quality: "auto:good" }],
      });
      mediumUrl = cloudinary.url(publicId, {
        transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto:good" }],
      });
      largeUrl = cloudinary.url(publicId, {
        transformation: [{ width: 1920, height: 1920, crop: "limit", quality: "auto:good" }],
      });
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      thumbnailUrl,
      mediumUrl,
      largeUrl,
    };
  } catch (error: any) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * 上傳圖片到 Supabase Storage
 */
export async function uploadToSupabase(
  file: File | Buffer,
  bucket: string = "uploads",
  path: string = "",
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
): Promise<UploadResult> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error("Supabase is not configured");
    }

    // 生成唯一檔名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file instanceof File ? file.name.split(".").pop() : "jpg";
    const fileName = `${path}/${timestamp}-${randomString}.${extension}`;

    // 轉換為 Buffer
    let buffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }

    // 上傳到 Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file instanceof File ? file.type : "image/jpeg",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // 獲取公開 URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return {
      url: publicUrl,
      publicId: fileName,
    };
  } catch (error: any) {
    console.error("Error uploading to Supabase:", error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * 驗證圖片檔案
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // 檢查檔案類型
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "不支援的圖片格式。請上傳 JPG、PNG、WebP 或 GIF 格式的圖片。",
    };
  }

  // 檢查檔案大小（最大 10MB）
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "圖片檔案過大。請上傳小於 10MB 的圖片。",
    };
  }

  return { valid: true };
}

/**
 * 刪除 Cloudinary 圖片
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return false;
  }
}

/**
 * 刪除 Supabase Storage 圖片
 */
export async function deleteFromSupabase(
  bucket: string,
  path: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Error deleting from Supabase:", error);
    return false;
  }
}


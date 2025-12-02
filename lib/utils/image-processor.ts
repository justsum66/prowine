"use client";

/**
 * 客戶端圖片處理工具（裁剪、壓縮）
 */

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 壓縮圖片
 */
export async function compressImage(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "image/jpeg" | "image/png" | "image/webp";
  }
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // 計算縮放比例
        if (options?.maxWidth && width > options.maxWidth) {
          height = (height * options.maxWidth) / width;
          width = options.maxWidth;
        }
        if (options?.maxHeight && height > options.maxHeight) {
          width = (width * options.maxHeight) / height;
          height = options.maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("無法創建 canvas context"));
          return;
        }

        // 繪製圖片
        ctx.drawImage(img, 0, 0, width, height);

        // 轉換為 Blob
        const format = options?.format || "image/jpeg";
        const quality = options?.quality || 0.85;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("壓縮失敗"));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          format,
          quality
        );
      };
      img.onerror = () => reject(new Error("圖片載入失敗"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("文件讀取失敗"));
    reader.readAsDataURL(file);
  });
}

/**
 * 裁剪圖片
 */
export async function cropImage(
  file: File,
  cropArea: CropArea,
  options?: {
    quality?: number;
    format?: "image/jpeg" | "image/png" | "image/webp";
  }
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("無法創建 canvas context"));
          return;
        }

        // 繪製裁剪區域
        ctx.drawImage(
          img,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          cropArea.width,
          cropArea.height
        );

        // 轉換為 Blob
        const format = options?.format || "image/jpeg";
        const quality = options?.quality || 0.9;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("裁剪失敗"));
              return;
            }
            const croppedFile = new File([blob], file.name, {
              type: format,
              lastModified: Date.now(),
            });
            resolve(croppedFile);
          },
          format,
          quality
        );
      };
      img.onerror = () => reject(new Error("圖片載入失敗"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("文件讀取失敗"));
    reader.readAsDataURL(file);
  });
}

/**
 * 獲取圖片尺寸
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => reject(new Error("圖片載入失敗"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("文件讀取失敗"));
    reader.readAsDataURL(file);
  });
}

/**
 * 創建圖片預覽 URL（使用 URL.createObjectURL 更高效）
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}


"use client";

/**
 * File System Access API 工具函數
 * 允許用戶直接訪問本地文件系統
 */

/**
 * 檢查是否支持 File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return "showOpenFilePicker" in window || "showSaveFilePicker" in window;
}

/**
 * 打開文件選擇器
 */
export async function openFilePicker(
  options?: {
    multiple?: boolean;
    accept?: Record<string, string[]>;
    excludeAcceptAllOption?: boolean;
  }
): Promise<File[]> {
  if (!isFileSystemAccessSupported()) {
    // 降級到傳統文件輸入
    return openFilePickerFallback(options);
  }

  try {
    const fileHandles = await (window as any).showOpenFilePicker({
      multiple: options?.multiple || false,
      types: options?.accept
        ? [
            {
              description: "選擇文件",
              accept: options.accept,
            },
          ]
        : undefined,
      excludeAcceptAllOption: options?.excludeAcceptAllOption || false,
    });

    const files: File[] = [];
    for (const handle of fileHandles) {
      const file = await handle.getFile();
      files.push(file);
    }

    return files;
  } catch (error: any) {
    if (error.name === "AbortError") {
      // 用戶取消選擇
      return [];
    }
    throw error;
  }
}

/**
 * 保存文件
 */
export async function saveFile(
  data: Blob | string,
  options?: {
    suggestedName?: string;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }
): Promise<boolean> {
  if (!isFileSystemAccessSupported()) {
    // 降級到下載
    return saveFileFallback(data, options?.suggestedName);
  }

  try {
    const fileHandle = await (window as any).showSaveFilePicker({
      suggestedName: options?.suggestedName || "download",
      types: options?.types || [
        {
          description: "文件",
          accept: {
            "application/octet-stream": [".*"],
          },
        },
      ],
    });

    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();

    return true;
  } catch (error: any) {
    if (error.name === "AbortError") {
      // 用戶取消保存
      return false;
    }
    throw error;
  }
}

/**
 * 降級方案：使用傳統文件輸入
 */
function openFilePickerFallback(
  options?: {
    multiple?: boolean;
    accept?: Record<string, string[]>;
  }
): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = options?.multiple || false;

    if (options?.accept) {
      const acceptTypes = Object.values(options.accept)
        .flat()
        .join(",");
      input.accept = acceptTypes;
    }

    input.onchange = (e: any) => {
      const files = Array.from(e.target.files || []) as File[];
      resolve(files);
    };

    input.click();
  });
}

/**
 * 降級方案：使用下載
 */
function saveFileFallback(data: Blob | string, suggestedName?: string): boolean {
  try {
    const blob = typeof data === "string" ? new Blob([data]) : data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedName || "download";
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("保存文件失敗:", error);
    return false;
  }
}

/**
 * 讀取文件內容
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

/**
 * 讀取文件為 ArrayBuffer
 */
export async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * 讀取文件為 Data URL
 */
export async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}


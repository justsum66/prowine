"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Crop as CropIcon, Check, Loader2, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactCrop, { Crop, PixelCrop, makeAspectCrop, centerCrop, convertToPixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { compressImage, cropImage, CropArea as ImageCropArea, getImageDimensions } from "@/lib/utils/image-processor";
import { logger } from "@/lib/utils/logger-production"; // Q22優化：使用logger替代console

interface ImageUploaderProps {
  onUpload: (urls: string[]) => void;
  folder?: string;
  multiple?: boolean;
  maxFiles?: number;
  enableCrop?: boolean;
  enableCompress?: boolean;
  generateSizes?: boolean;
  addWatermark?: boolean;
  aspectRatio?: number; // 裁剪寬高比，例如 1 = 正方形，16/9 = 橫向等
}

export default function ImageUploader({
  onUpload,
  folder = "prowine",
  multiple = false,
  maxFiles = 10,
  enableCrop = true,
  enableCompress = true,
  generateSizes = true,
  addWatermark = false,
  aspectRatio,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});
  const [cropMode, setCropMode] = useState<number | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSrc, setImageSrc] = useState<string>("");
  const [rotation, setRotation] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // 轉換 PixelCrop 為 ImageCropArea
  const pixelCropToImageCropArea = (pixelCrop: PixelCrop): ImageCropArea => ({
    x: pixelCrop.x,
    y: pixelCrop.y,
    width: pixelCrop.width,
    height: pixelCrop.height,
  });

  // 當裁剪完成時，更新預覽畫布
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspectRatio) {
      const { width, height } = e.currentTarget;
      const crop = makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        aspectRatio,
        width,
        height
      );
      const centeredCrop = centerCrop(crop, width, height);
      setCrop(centeredCrop);
    } else {
      const { width, height } = e.currentTarget;
      const crop = makeAspectCrop(
        {
          unit: "%",
          width: 90,
        },
        1, // 預設正方形
        width,
        height
      );
      const centeredCrop = centerCrop(crop, width, height);
      setCrop(centeredCrop);
    }
  }, [aspectRatio]);

  // 繪製裁剪預覽到 canvas
  const drawCroppedImage = useCallback(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const pixelRatio = window.devicePixelRatio;
    canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = "high";

    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;

    ctx.save();
    ctx.translate(-cropX, -cropY);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(cropX, cropY);
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight
    );
    ctx.restore();
  }, [completedCrop, rotation]);

  // 當裁剪區域改變時更新畫布
  useEffect(() => {
    drawCroppedImage();
  }, [completedCrop, drawCroppedImage]);

  const handleFileSelect = async (selectedFiles: FileList) => {
    const fileArray = Array.from(selectedFiles);
    const remainingSlots = maxFiles - files.length;

    if (fileArray.length > remainingSlots) {
      alert(`最多只能上傳 ${maxFiles} 張圖片`);
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of fileArray) {
      // 壓縮圖片（如果啟用）
      let processedFile = file;
      if (enableCompress) {
        try {
          processedFile = await compressImage(file, {
            maxWidth: 2000,
            maxHeight: 2000,
            quality: 0.85,
          });
        } catch (error) {
          // Q22優化：使用logger替代console.error
          logger.error("壓縮失敗", error instanceof Error ? error : new Error(String(error)));
        }
      }

      newFiles.push(processedFile);
      const preview = URL.createObjectURL(processedFile);
      newPreviews.push(preview);
    }

    setFiles([...files, ...newFiles]);
    setPreviews([...previews, ...newPreviews]);
  };

  const handleCropStart = (index: number) => {
    setCropMode(index);
    setImageSrc(previews[index]);
    setRotation(0);
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const handleCropComplete = async (index: number) => {
    if (!completedCrop || !imgRef.current || cropMode === null) return;

    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const cropArea: ImageCropArea = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      const croppedFile = await cropImage(files[index], cropArea);
      const newFiles = [...files];
      newFiles[index] = croppedFile;
      setFiles(newFiles);

      // 清理舊的預覽 URL
      URL.revokeObjectURL(previews[index]);
      const preview = URL.createObjectURL(croppedFile);
      const newPreviews = [...previews];
      newPreviews[index] = preview;
      setPreviews(newPreviews);

      setCropMode(null);
      setImageSrc("");
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (error) {
      // Q22優化：使用logger替代console.error
      logger.error("裁剪失敗", error instanceof Error ? error : new Error(String(error)));
      alert("圖片裁剪失敗");
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        formData.append("storage", "cloudinary");
        formData.append("generateSizes", generateSizes ? "true" : "false");
        formData.append("addWatermark", addWatermark ? "true" : "false");

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          uploadedUrls.push(result.url);
          setUploadProgress((prev) => ({ ...prev, [i]: 100 }));
        } else {
          throw new Error(`上傳失敗: ${file.name}`);
        }
      }

      onUpload(uploadedUrls);
      // 清理所有預覽 URL
      previews.forEach((url) => URL.revokeObjectURL(url));
      setFiles([]);
      setPreviews([]);
      setUploadProgress({});
    } catch (error: unknown) {
      // Q22優化：使用logger替代console.error
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error("上傳失敗", errorObj);
      alert(errorObj.message || "圖片上傳失敗");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  return (
    <div className="space-y-4">
      {/* 文件選擇 */}
      <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6 text-center">
        <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
          拖放圖片到此處或點擊選擇
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFileSelect(e.target.files);
            }
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || files.length >= maxFiles}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          選擇圖片
        </button>
      </div>

      {/* 預覽區域 */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700"
            >
              <img
                src={preview}
                alt={`預覽 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {enableCrop && (
                  <button
                    type="button"
                    onClick={() => handleCropStart(index)}
                    className="p-2 bg-white/90 dark:bg-neutral-800 rounded-lg hover:bg-white dark:hover:bg-neutral-700 transition-colors"
                    title="裁剪"
                  >
                    <CropIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600 transition-colors"
                  title="刪除"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {uploadProgress[index] !== undefined && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-700">
                  <div
                    className="h-full bg-primary-600 transition-all"
                    style={{ width: `${uploadProgress[index]}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 裁剪模式 */}
      <AnimatePresence>
        {cropMode !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setCropMode(null);
                setImageSrc("");
                setCrop(undefined);
                setCompletedCrop(undefined);
              }
            }}
          >
            <div
              className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
                裁剪圖片
              </h3>
              <div className="relative mb-4 flex flex-col items-center">
                <div className="relative">
                  {imageSrc && (
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(c) => {
                        if (imgRef.current) {
                          setCompletedCrop(convertToPixelCrop(c, imgRef.current.width, imgRef.current.height));
                        }
                      }}
                      aspect={aspectRatio}
                      minWidth={100}
                      minHeight={100}
                      className="max-h-[60vh]"
                    >
                      <img
                        ref={imgRef}
                        src={imageSrc}
                        alt="裁剪"
                        onLoad={onImageLoad}
                        style={{
                          transform: `rotate(${rotation}deg)`,
                          maxWidth: "100%",
                          maxHeight: "60vh",
                          objectFit: "contain",
                        }}
                      />
                    </ReactCrop>
                  )}
                </div>
                {completedCrop && (
                  <div className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-900 rounded-lg">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                      裁剪預覽：
                    </p>
                    <canvas
                      ref={previewCanvasRef}
                      style={{
                        display: "block",
                        maxWidth: "200px",
                        maxHeight: "200px",
                        border: "1px solid #e5e7eb",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-between items-center">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <RotateCw className="w-4 h-4" />
                    旋轉
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCropMode(null);
                      setImageSrc("");
                      setCrop(undefined);
                      setCompletedCrop(undefined);
                      setRotation(0);
                    }}
                    className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCropComplete(cropMode)}
                    disabled={!completedCrop}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    確認裁剪
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 上傳按鈕 */}
      {files.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            已選擇 {files.length} 張圖片
          </p>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                上傳中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                上傳圖片
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

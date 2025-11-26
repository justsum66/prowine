'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ImageWithFallbackProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  sizes?: string
  priority?: boolean
  unoptimized?: boolean
  fallbackSrc?: string
}

/**
 * 帶有錯誤處理和占位符的圖片組件
 * 優化性能：lazy loading, error handling, fallback
 */
export function ImageWithFallback({
  src,
  alt,
  fill,
  width,
  height,
  className = '',
  sizes,
  priority = false,
  unoptimized = false,
  fallbackSrc = '/placeholder-wine.png',
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError && imgSrc !== fallbackSrc) {
      setHasError(true)
      setImgSrc(fallbackSrc)
      setIsLoading(false)
    }
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''} ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-secondary-grey-100 animate-pulse" />
      )}
      {fill ? (
        <Image
          src={imgSrc}
          alt={alt}
          fill
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized || imgSrc.startsWith('http://')}
          onError={handleError}
          onLoad={handleLoad}
        />
      ) : (
        <Image
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized || imgSrc.startsWith('http://')}
          onError={handleError}
          onLoad={handleLoad}
        />
      )}
    </div>
  )
}


'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageWithBlurProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

// Base64 placeholder for blur effect (1x1 transparent pixel)
const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#3b82f6" stop-opacity="0.1" offset="0%" />
      <stop stop-color="#6366f1" stop-opacity="0.2" offset="50%" />
      <stop stop-color="#3b82f6" stop-opacity="0.1" offset="100%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#3b82f6" fill-opacity="0.1" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

export default function ImageWithBlur({
  src,
  alt,
  fill,
  width,
  height,
  className,
  priority = false,
  sizes,
  quality = 85,
  onLoad,
  placeholder = 'blur',
  blurDataURL,
}: ImageWithBlurProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Use a better placeholder if image fails
  const imageSrc = hasError 
    ? 'https://via.placeholder.com/800x450/3b82f6/ffffff?text=Course+Image'
    : src;

  // Generate blur placeholder if not provided
  const defaultBlurDataURL = blurDataURL || `data:image/svg+xml;base64,${toBase64(shimmer(width || 800, height || 450))}`;

  // Determine if image should be optimized
  // For external images that might timeout (like Unsplash), use unoptimized
  const isExternalImage = imageSrc.startsWith('http://') || imageSrc.startsWith('https://');
  const isUnsplash = imageSrc.includes('unsplash.com');
  const shouldOptimize = !imageSrc.startsWith('https://via.placeholder.com') && 
                         !imageSrc.includes('localhost') && 
                         !imageSrc.includes('127.0.0.1') &&
                         !isUnsplash; // Don't optimize Unsplash images to avoid timeout

  return (
    <div className={cn('relative overflow-hidden', fill && 'h-full w-full', className)}>
      {isLoading && !placeholder && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-indigo-500/10 to-purple-500/10 animate-pulse" />
      )}
      {hasError ? (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">تصویر یافت نشد</span>
        </div>
      ) : (
        <Image
          src={imageSrc}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          className={cn(
            'transition-all duration-700',
            isLoading && !placeholder ? 'blur-2xl scale-110 opacity-0' : 'blur-0 scale-100 opacity-100',
            className
          )}
          priority={priority}
          sizes={sizes || (fill ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' : undefined)}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? defaultBlurDataURL : undefined}
          onLoad={handleLoad}
          onError={handleError}
          unoptimized={!shouldOptimize || isUnsplash}
          loading={priority ? undefined : 'lazy'}
        />
      )}
    </div>
  );
}


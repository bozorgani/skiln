'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface FileUploadProps {
  type: 'image' | 'video';
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: string;
  maxSize?: number; // in MB
}

export default function FileUpload({
  type,
  value,
  onChange,
  label,
  accept,
  maxSize = 100,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: 'خطا',
        description: `حجم فایل نباید بیشتر از ${maxSize} مگابایت باشد`,
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const allowedTypes = type === 'image' 
      ? ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      : ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'خطا',
        description: `نوع فایل مجاز نیست. فقط ${type === 'image' ? 'تصویر' : 'ویدیو'} مجاز است.`,
        variant: 'destructive',
      });
      return;
    }

    // Create temporary preview (will be replaced with uploaded URL)
    if (type === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // For video, create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout
      
      // Use query parameter instead of form data for type
      const response = await fetch(`${API_URL}/upload?type=${type}`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'آپلود فایل ناموفق بود');
      }

      // Construct full URL - ensure it's a complete URL
      let fileUrl = data.data.path;
      if (!fileUrl.startsWith('http')) {
        const baseUrl = API_URL.replace('/api', '');
        fileUrl = `${baseUrl}${fileUrl}`;
      }
      
      // Clean up temporary preview URLs
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      
      onChange(fileUrl);
      setPreview(fileUrl);
      toast({
        title: 'موفق',
        description: 'فایل با موفقیت آپلود شد',
      });
    } catch (error: any) {
      toast({
        title: 'خطا',
        description: error.message || 'آپلود فایل ناموفق بود',
        variant: 'destructive',
      });
      // Clean up preview URL on error
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    // Clean up preview URL if it's a blob URL
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update preview when value changes externally
  useEffect(() => {
    if (value && value !== preview) {
      setPreview(value);
    } else if (!value && preview) {
      setPreview(null);
    }
  }, [value]);

  const defaultAccept = type === 'image' 
    ? 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
    : 'video/mp4,video/webm,video/ogg,video/quicktime';

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium block">
          {label}
        </label>
      )}
      
      <div className="space-y-2">
        {/* Preview */}
        {preview && (
          <div className="relative border rounded-lg overflow-hidden">
            {type === 'image' ? (
              <div className="relative w-full h-32 sm:h-48">
                {preview.startsWith('data:') ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : preview.startsWith('/uploads') || preview.includes('localhost') || preview.includes('127.0.0.1') ? (
                  // For localhost or relative paths, use img tag
                  <img
                    src={preview.startsWith('/uploads') ? `${API_URL.replace('/api', '')}${preview}` : preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={preview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    unoptimized={preview.includes('localhost') || preview.includes('127.0.0.1')}
                  />
                )}
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 z-10"
                  aria-label="حذف تصویر"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            ) : (
              <div className="relative w-full h-32 sm:h-48 bg-muted flex items-center justify-center">
                {preview.startsWith('data:') || preview.startsWith('http') || preview.startsWith('/uploads') ? (
                  <video
                    src={preview}
                    className="w-full h-full object-contain"
                    controls
                  />
                ) : (
                  <Video className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                )}
                <button
                  type="button"
                  onClick={handleRemove}
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 z-10"
                  aria-label="حذف ویدیو"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* File Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept || defaultAccept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id={`file-upload-${type}`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 w-full sm:w-auto text-sm"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال آپلود...
              </>
            ) : (
              <>
                {type === 'image' ? (
                  <ImageIcon className="h-4 w-4" />
                ) : (
                  <Video className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{preview ? 'تغییر فایل' : 'انتخاب فایل'}</span>
                <span className="sm:hidden">{preview ? 'تغییر' : 'انتخاب'}</span>
              </>
            )}
          </Button>
          {value && !preview && (
            <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-full sm:max-w-xs">
              {value}
            </span>
          )}
        </div>

        {/* URL Input (fallback) */}
        {!preview && (
          <>
            <div className="text-xs text-muted-foreground">
              یا آدرس URL را وارد کنید:
            </div>
            <Input
              type="url"
              placeholder={type === 'image' ? 'https://example.com/image.jpg' : 'https://example.com/video.mp4'}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="text-xs sm:text-sm"
            />
          </>
        )}
      </div>
    </div>
  );
}


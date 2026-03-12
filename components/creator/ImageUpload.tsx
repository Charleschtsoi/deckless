'use client';

import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { ProcessedImage, validateImageFile } from '@/lib/utils/image-handler';

interface ImageUploadProps {
  images: ProcessedImage[];
  onImagesChange: (images: ProcessedImage[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

export default function ImageUpload({
  images,
  onImagesChange,
  disabled = false,
  maxImages = 10,
}: ImageUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const validation = validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
    } else {
      setError(null);
    }

    if (validFiles.length === 0) return;

    const currentCount = images.length;
    const remainingSlots = maxImages - currentCount;
    const filesToProcess = validFiles.slice(0, remainingSlots);

    if (filesToProcess.length < validFiles.length) {
      setError(`Only ${remainingSlots} more image(s) allowed`);
    }

    try {
      const processedImages = await Promise.all(
        filesToProcess.map(async (file) => {
          const reader = new FileReader();
          return new Promise<ProcessedImage>((resolve, reject) => {
            reader.onload = () => {
              const dataUrl = reader.result as string;
              const base64 = dataUrl.split(',')[1] || '';
              resolve({
                id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                name: file.name,
                dataUrl,
                base64,
                mimeType: file.type,
                size: file.size,
              });
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          });
        })
      );

      onImagesChange([...images, ...processedImages]);
    } catch (err) {
      setError('Failed to process images. Please try again.');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFiles(files);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (id: string) => {
    onImagesChange(images.filter(img => img.id !== id));
    setError(null);
  };

  const handleClick = () => {
    if (!disabled && images.length < maxImages) {
      fileInputRef.current?.click();
    }
  };

  const isFull = images.length >= maxImages;

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload Images ({images.length}/{maxImages})
      </label>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative w-full min-h-32
          border-2 border-dashed rounded-lg
          flex flex-col items-center justify-center
          cursor-pointer transition-all duration-200
          ${isDragActive && !disabled
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }
          ${disabled || isFull
            ? 'opacity-50 cursor-not-allowed'
            : ''
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          disabled={disabled || isFull}
          className="hidden"
        />

        {images.length === 0 ? (
          <>
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 text-center px-4">
              Drag and drop images here, or click to select
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPEG, PNG, WebP, or GIF (max 10MB each)
            </p>
          </>
        ) : (
          <div className="w-full p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                >
                  <img
                    src={image.dataUrl}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(image.id);
                    }}
                    disabled={disabled}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {!isFull && (
                <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600">{error}</div>
      )}

      {/* Helper Text */}
      {!error && images.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          Images will be mapped to slides by the AI
        </p>
      )}
    </div>
  );
}

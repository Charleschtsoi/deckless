/**
 * File handling utilities for mobile_slide
 * Supports images and PDFs with base64 encoding (MVP) with extensible architecture for cloud storage
 */

export interface ProcessedImage {
  id: string;
  name: string;
  dataUrl: string;
  base64: string;
  mimeType: string;
  size: number;
  type: 'image' | 'pdf';
}

/**
 * Convert a File to base64 data URL
 */
export async function fileToBase64(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';
      
      resolve({
        id: generateImageId(),
        name: file.name,
        dataUrl,
        base64,
        mimeType: file.type,
        size: file.size,
        type: fileType,
      });
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Process multiple image/PDF files to base64
 */
export async function processImages(files: File[]): Promise<ProcessedImage[]> {
  const validFiles = files.filter(file => 
    file.type.startsWith('image/') || file.type === 'application/pdf'
  );
  
  if (validFiles.length === 0) {
    throw new Error('No valid image or PDF files provided');
  }
  
  return Promise.all(validFiles.map(file => fileToBase64(file)));
}

/**
 * Generate a unique ID for an image
 */
function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validate image or PDF file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 20 * 1024 * 1024; // 20MB (increased for PDFs)
  const allowedTypes = [
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/gif',
    'application/pdf'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Please use JPEG, PNG, WebP, GIF, or PDF.`,
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum of 20MB.`,
    };
  }
  
  return { valid: true };
}

/**
 * Cloud storage abstraction (for future implementation)
 * This interface allows us to swap base64 for cloud storage later
 */
export interface ImageStorageProvider {
  upload(file: File): Promise<string>; // Returns URL or identifier
  delete(identifier: string): Promise<void>;
}

/**
 * Base64 storage provider (current implementation)
 */
export class Base64StorageProvider implements ImageStorageProvider {
  async upload(file: File): Promise<string> {
    const processed = await fileToBase64(file);
    return processed.dataUrl;
  }
  
  async delete(_identifier: string): Promise<void> {
    // No-op for base64 storage
  }
}

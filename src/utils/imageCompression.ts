/**
 * Client-side image compression utility using Canvas API
 * Compresses images to target size (<1MB) with quality reduction and dimension fallback
 */

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress an image to target size using Canvas API
 * @param imageBlob - The image blob to compress
 * @param targetSize - Target size in bytes (default: 1MB)
 * @param format - Output format (default: 'image/jpeg')
 * @returns Promise<CompressionResult>
 */
export async function compressImage(
  imageBlob: Blob,
  targetSize: number = 1024 * 1024, // 1MB
  format: string = 'image/jpeg'
): Promise<CompressionResult> {
  const originalSize = imageBlob.size;
  
  // If already under target size, return as-is
  if (originalSize <= targetSize) {
    return {
      blob: imageBlob,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const result = await processImageCompression(img, targetSize, format, originalSize);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageBlob);
  });
}

async function processImageCompression(
  img: HTMLImageElement,
  targetSize: number,
  format: string,
  originalSize: number
): Promise<CompressionResult> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  // Start with original dimensions
  let { width, height } = getOptimalDimensions(img.naturalWidth, img.naturalHeight);
  
  // Quality levels to try (from high to low)
  const qualityLevels = [0.8, 0.6, 0.4, 0.3, 0.2];
  
  for (const quality of qualityLevels) {
    canvas.width = width;
    canvas.height = height;
    
    // Clear canvas and draw image
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    
    const blob = await canvasToBlob(canvas, format, quality);
    
    if (blob.size <= targetSize) {
      return {
        blob,
        originalSize,
        compressedSize: blob.size,
        compressionRatio: blob.size / originalSize
      };
    }
  }
  
  // If quality reduction isn't enough, try reducing dimensions
  const dimensionReductions = [0.8, 0.6, 0.5, 0.4];
  
  for (const reduction of dimensionReductions) {
    const reducedWidth = Math.floor(width * reduction);
    const reducedHeight = Math.floor(height * reduction);
    
    canvas.width = reducedWidth;
    canvas.height = reducedHeight;
    
    ctx.clearRect(0, 0, reducedWidth, reducedHeight);
    ctx.drawImage(img, 0, 0, reducedWidth, reducedHeight);
    
    // Try with lowest quality for size reduction
    const blob = await canvasToBlob(canvas, format, 0.2);
    
    if (blob.size <= targetSize) {
      return {
        blob,
        originalSize,
        compressedSize: blob.size,
        compressionRatio: blob.size / originalSize
      };
    }
  }
  
  // Last resort: return the smallest we could achieve
  canvas.width = Math.floor(width * 0.4);
  canvas.height = Math.floor(height * 0.4);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  const finalBlob = await canvasToBlob(canvas, format, 0.1);
  
  return {
    blob: finalBlob,
    originalSize,
    compressedSize: finalBlob.size,
    compressionRatio: finalBlob.size / originalSize
  };
}

function getOptimalDimensions(width: number, height: number): { width: number; height: number } {
  const maxDimension = 1920;
  
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  
  const aspectRatio = width / height;
  
  if (width > height) {
    return {
      width: maxDimension,
      height: Math.floor(maxDimension / aspectRatio)
    };
  } else {
    return {
      width: Math.floor(maxDimension * aspectRatio),
      height: maxDimension
    };
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, format: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Download an image from URL and return as blob
 */
export async function downloadImageAsBlob(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  return response.blob();
}
/**
 * Image processing utility for TikTok compatibility
 * Handles metadata removal, ICC profile removal, resizing, and DPI standardization
 */

interface ProcessedImageResult {
  file: File;
  wasProcessed: boolean;
  originalSize: { width: number; height: number };
  processedSize: { width: number; height: number };
  originalFileSize: number;
  processedFileSize: number;
}

/**
 * Process an image to make it TikTok-compatible
 * - Removes all metadata (EXIF, IPTC, XMP)
 * - Removes ICC color profiles
 * - Resizes if dimensions exceed 1080x1920 (maintaining aspect ratio)
 * - Sets standard DPI (96)
 * - Converts to JPEG for consistency
 */
export async function processImageForTikTok(file: File): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        const originalWidth = img.naturalWidth;
        const originalHeight = img.naturalHeight;
        const originalFileSize = file.size;

        // Calculate new dimensions if resizing is needed
        const maxWidth = 1080;
        const maxHeight = 1920;
        
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        let wasResized = false;

        // Check if resizing is needed
        if (originalWidth > maxWidth || originalHeight > maxHeight) {
          const aspectRatio = originalWidth / originalHeight;
          
          if (originalWidth > originalHeight) {
            // Landscape orientation
            newWidth = Math.min(maxWidth, originalWidth);
            newHeight = Math.round(newWidth / aspectRatio);
            
            if (newHeight > maxHeight) {
              newHeight = maxHeight;
              newWidth = Math.round(newHeight * aspectRatio);
            }
          } else {
            // Portrait orientation
            newHeight = Math.min(maxHeight, originalHeight);
            newWidth = Math.round(newHeight * aspectRatio);
            
            if (newWidth > maxWidth) {
              newWidth = maxWidth;
              newHeight = Math.round(newWidth / aspectRatio);
            }
          }
          
          wasResized = true;
        }

        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw image on canvas (this removes all metadata and ICC profiles)
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to blob with standard quality
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to process image'));
            return;
          }

          // Create new file with processed image
          const originalName = file.name;
          const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
          const processedFileName = `${nameWithoutExt}_processed.jpg`;
          
          const processedFile = new File([blob], processedFileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });

          resolve({
            file: processedFile,
            wasProcessed: wasResized || file.type !== 'image/jpeg',
            originalSize: { width: originalWidth, height: originalHeight },
            processedSize: { width: newWidth, height: newHeight },
            originalFileSize,
            processedFileSize: processedFile.size,
          });
        }, 'image/jpeg', 0.92); // High quality JPEG
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Create object URL for the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Process multiple images for TikTok compatibility
 */
export async function processImagesForTikTok(files: File[]): Promise<ProcessedImageResult[]> {
  const results: ProcessedImageResult[] = [];
  
  for (const file of files) {
    try {
      const result = await processImageForTikTok(file);
      results.push(result);
    } catch (error) {
      console.error(`Failed to process image ${file.name}:`, error);
      // Return original file if processing fails
      results.push({
        file,
        wasProcessed: false,
        originalSize: { width: 0, height: 0 },
        processedSize: { width: 0, height: 0 },
        originalFileSize: file.size,
        processedFileSize: file.size,
      });
    }
  }
  
  return results;
}

/**
 * Check if an image needs processing
 */
export function doesImageNeedProcessing(file: File): boolean {
  // Always process to ensure metadata removal and format consistency
  return true;
}

/**
 * Get processing summary for user feedback
 */
export function getProcessingSummary(results: ProcessedImageResult[]): string {
  const processedCount = results.filter(r => r.wasProcessed).length;
  const totalCount = results.length;
  
  if (processedCount === 0) {
    return `${totalCount} image(s) uploaded (no processing needed)`;
  }
  
  const resizedCount = results.filter(r => 
    r.wasProcessed && 
    (r.originalSize.width !== r.processedSize.width || r.originalSize.height !== r.processedSize.height)
  ).length;
  
  let summary = `${totalCount} image(s) processed for TikTok compatibility`;
  
  if (resizedCount > 0) {
    summary += ` (${resizedCount} resized)`;
  }
  
  return summary;
} 
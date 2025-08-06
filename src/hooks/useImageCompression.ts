import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage, downloadImageAsBlob } from '@/utils/imageCompression';
import { useToast } from '@/hooks/use-toast';

interface CompressionStatus {
  isCompressing: boolean;
  progress: number;
}

export function useImageCompression() {
  const [compressionStatus, setCompressionStatus] = useState<CompressionStatus>({
    isCompressing: false,
    progress: 0
  });
  const { toast } = useToast();

  const compressEnhancedImage = useCallback(async (
    itemId: string, 
    itemType: 'product' | 'image',
    enhancedImagePath: string
  ) => {
    try {
      setCompressionStatus({ isCompressing: true, progress: 0 });
      
      const table = itemType === 'product' ? 'products' : 'images';
      const imageUrl = `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${enhancedImagePath}`;
      
      setCompressionStatus({ isCompressing: true, progress: 20 });
      
      // Download the enhanced image
      const imageBlob = await downloadImageAsBlob(imageUrl);
      console.log(`Original enhanced image size: ${Math.round(imageBlob.size / 1024)}KB`);
      
      setCompressionStatus({ isCompressing: true, progress: 40 });
      
      // Compress the image
      const compressionResult = await compressImage(imageBlob, 1024 * 1024); // 1MB target
      console.log(`Compressed image size: ${Math.round(compressionResult.compressedSize / 1024)}KB`);
      console.log(`Compression ratio: ${Math.round(compressionResult.compressionRatio * 100)}%`);
      
      setCompressionStatus({ isCompressing: true, progress: 60 });
      
      // Upload compressed image
      const compressedFileName = `enhanced-${itemId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(compressedFileName, compressionResult.blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setCompressionStatus({ isCompressing: true, progress: 80 });

      // Update database with compressed image path
      const { error: updateError } = await supabase
        .from(table)
        .update({
          enhanced_image_path: compressedFileName,
          image_enhancement_status: 'completed'
        })
        .eq('id', itemId);

      if (updateError) {
        throw new Error(`Database update failed: ${updateError.message}`);
      }

      setCompressionStatus({ isCompressing: true, progress: 90 });

      // Clean up temp file if it exists
      if (enhancedImagePath.includes('enhanced-temp-')) {
        await supabase.storage
          .from('restaurant-images')
          .remove([enhancedImagePath]);
      }

      setCompressionStatus({ isCompressing: true, progress: 100 });
      
      console.log('Client-side compression completed successfully');
      
      toast({
        title: 'Image Optimized! ✨',
        description: `Reduced size to ${Math.round(compressionResult.compressedSize / 1024)}KB (${Math.round(compressionResult.compressionRatio * 100)}% of original)`,
      });

      return compressedFileName;
      
    } catch (error) {
      console.error('Client-side compression failed:', error);
      
      // Mark as failed and clean up
      const table = itemType === 'product' ? 'products' : 'images';
      await supabase
        .from(table)
        .update({ image_enhancement_status: 'failed' })
        .eq('id', itemId);

      toast({
        title: 'Compression Failed',
        description: 'Failed to compress enhanced image. Please try again.',
        variant: 'destructive'
      });
      
      throw error;
    } finally {
      setCompressionStatus({ isCompressing: false, progress: 0 });
    }
  }, [toast]);

  return {
    compressEnhancedImage,
    compressionStatus
  };
}
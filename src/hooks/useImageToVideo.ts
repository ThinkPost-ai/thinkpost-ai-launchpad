import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProcessImageResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  publicVideoUrl?: string;
  sessionId?: string;
  tiktok?: {
    success: boolean;
    publishId?: string;
    message?: string;
    error?: string;
  };
  error?: string;
}

export const useImageToVideo = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const processImage = async (
    imageUrl: string, 
    caption?: string, 
    publishToTikTok: boolean = false
  ): Promise<ProcessImageResult> => {
    setIsProcessing(true);
    setIsConverting(true);

    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('You must be logged in to process images');
      }

      toast.info('Starting image to video conversion...', {
        description: 'This may take a few moments'
      });

      // Call the process-image-for-tiktok function
      const { data, error } = await supabase.functions.invoke('process-image-for-tiktok', {
        body: {
          imageUrl,
          caption,
          publishToTikTok
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to process image');
      }

      if (!data.success) {
        throw new Error(data.error || 'Image processing failed');
      }

      setIsConverting(false);

      if (publishToTikTok) {
        setIsPublishing(true);
        
        if (data.tiktok?.success) {
          toast.success('Successfully posted to TikTok!', {
            description: data.tiktok.message || 'Your video has been sent to TikTok for processing'
          });
        } else {
          toast.error('TikTok posting failed', {
            description: data.tiktok?.error || 'Failed to publish to TikTok'
          });
        }
        
        setIsPublishing(false);
      } else {
        toast.success('Video conversion completed!', {
          description: 'Your image has been converted to a TikTok-ready video'
        });
      }

      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      toast.error('Processing failed', {
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
      setIsConverting(false);
      setIsPublishing(false);
    }
  };

  const convertImageOnly = async (imageUrl: string, caption?: string) => {
    return processImage(imageUrl, caption, false);
  };

  const convertAndPublish = async (imageUrl: string, caption: string) => {
    if (!caption.trim()) {
      toast.error('Caption required', {
        description: 'Please provide a caption for your TikTok post'
      });
      return {
        success: false,
        error: 'Caption is required for TikTok publishing'
      };
    }

    return processImage(imageUrl, caption, true);
  };

  return {
    processImage,
    convertImageOnly,
    convertAndPublish,
    isProcessing,
    isConverting,
    isPublishing
  };
}; 
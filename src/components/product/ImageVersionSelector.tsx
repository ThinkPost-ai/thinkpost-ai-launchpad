import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, ChevronLeft, ChevronRight, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ImageVersionSelectorProps {
  originalImagePath: string;
  enhancedImagePath?: string;
  enhancementStatus: 'none' | 'processing' | 'completed' | 'failed';
  selectedVersion: 'original' | 'enhanced';
  onVersionChange: (version: 'original' | 'enhanced') => void;
  onEnhance?: () => void;
  isEnhancing?: boolean;
}

export const ImageVersionSelector: React.FC<ImageVersionSelectorProps> = ({
  originalImagePath,
  enhancedImagePath,
  enhancementStatus,
  selectedVersion,
  onVersionChange,
  onEnhance,
  isEnhancing = false
}) => {
  const getImageUrl = (path: string) => 
    `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${path}`;

  const canShowEnhanced = enhancementStatus === 'completed' && enhancedImagePath;
  const currentImagePath = selectedVersion === 'enhanced' && enhancedImagePath ? enhancedImagePath : originalImagePath;

  return (
    <div className="space-y-4">
      {/* Image Display */}
      <Card className="relative overflow-hidden">
        <div className="aspect-square relative">
          <img
            src={getImageUrl(currentImagePath)}
            alt="Product"
            className="w-full h-full object-cover"
          />
          
          {/* Version Badge */}
          <div className="absolute top-2 left-2">
            <Badge variant={selectedVersion === 'enhanced' ? 'default' : 'secondary'}>
              {selectedVersion === 'enhanced' ? (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Enhanced
                </>
              ) : (
                <>
                  <ImageIcon className="w-3 h-3 mr-1" />
                  Original
                </>
              )}
            </Badge>
          </div>

          {/* Processing Overlay */}
          {enhancementStatus === 'processing' && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Enhancing image...</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Previous/Next buttons for version switching */}
          {canShowEnhanced && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVersionChange('original')}
                disabled={selectedVersion === 'original'}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Original
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVersionChange('enhanced')}
                disabled={selectedVersion === 'enhanced'}
              >
                Enhanced
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}
        </div>

        {/* Enhancement Controls */}
        <div className="flex items-center gap-2">
          {enhancementStatus === 'none' && onEnhance && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onEnhance}
              disabled={isEnhancing}
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enhance Image
                </>
              )}
            </Button>
          )}

          {enhancementStatus === 'failed' && onEnhance && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onEnhance}
              disabled={isEnhancing}
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Retry Enhancement'
              )}
            </Button>
          )}

          {enhancementStatus === 'processing' && (
            <Badge variant="secondary">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Processing...
            </Badge>
          )}

          {canShowEnhanced && (
            <Badge variant="default">
              <Sparkles className="w-3 h-3 mr-1" />
              Enhanced Ready
            </Badge>
          )}
        </div>
      </div>

      {/* Version Info */}
      {canShowEnhanced && (
        <div className="text-xs text-muted-foreground text-center">
          Viewing {selectedVersion} version • Use navigation buttons to switch between versions
        </div>
      )}
    </div>
  );
};
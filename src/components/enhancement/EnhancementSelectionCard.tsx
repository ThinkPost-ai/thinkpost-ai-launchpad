import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ImageIcon,
  Mouse,
  RefreshCw,
  Loader2,
  History
} from 'lucide-react';

interface EnhancementSelectionCardProps {
  enhancement: any;
  onSelectionChange: (enhancementId: string, selection: 'original' | 'enhanced') => void;
  onRegenerate: (enhancementId: string) => void;
}

const EnhancementSelectionCard = ({ 
  enhancement, 
  onSelectionChange, 
  onRegenerate 
}: EnhancementSelectionCardProps) => {
  const { toast } = useToast();
  const [selectedVersion, setSelectedVersion] = useState<'original' | 'enhanced'>('enhanced');
  const [currentImageIndex, setCurrentImageIndex] = useState(1); // 0 = original, 1 = enhanced
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  // Available images (original + enhanced versions)
  const images = [
    {
      type: 'original',
      url: enhancement.original_image_url,
      label: 'Original Image',
      description: 'Your uploaded image'
    },
    {
      type: 'enhanced',
      url: enhancement.enhanced_image_url,
      label: 'AI Enhanced',
      description: 'Enhanced with AI for better social media performance'
    }
  ];

  const currentImage = images[currentImageIndex];

  const handleNavigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (direction === 'next' && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handleSelectCurrentImage = async () => {
    const selectedType = currentImage.type as 'original' | 'enhanced';
    setSelectedVersion(selectedType);
    
    try {
      // Update database with user's selection
      const table = enhancement.content_type === 'product' ? 'products' : 'images';
      const { error } = await supabase
        .from(table)
        .update({ user_selected_version: selectedType })
        .eq('id', enhancement.content_id);

      if (error) throw error;

      onSelectionChange(enhancement.id, selectedType);

      toast({
        title: "Selection Updated",
        description: `${selectedType === 'enhanced' ? 'Enhanced' : 'Original'} image will be used for posting.`
      });
    } catch (error: any) {
      toast({
        title: "Selection Failed",
        description: error.message || "Failed to update selection",
        variant: "destructive"
      });
    }
  };

  const handleRegenerate = async () => {
    if (enhancement.regeneration_count >= enhancement.max_regenerations) {
      toast({
        title: "Regeneration Limit Reached",
        description: `Maximum ${enhancement.max_regenerations} regenerations allowed per image.`,
        variant: "destructive"
      });
      return;
    }

    setIsRegenerating(true);
    try {
      await onRegenerate(enhancement.id);
      toast({
        title: "Regenerating Image",
        description: "Your enhanced image is being regenerated with different parameters."
      });
    } catch (error) {
      toast({
        title: "Regeneration Failed",
        description: "Failed to regenerate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const canRegenerate = currentImageIndex === 1 && // Only for enhanced image
                       enhancement.regeneration_count < enhancement.max_regenerations &&
                       enhancement.status === 'completed';

  return (
    <Card className="p-6">
      {/* Header with Content Info */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="font-semibold text-lg">
            {enhancement.products?.name || enhancement.images?.original_filename}
          </h4>
          <p className="text-sm text-muted-foreground">
            {enhancement.content_type === 'product' ? 'Product Image' : 'General Content'}
          </p>
        </div>
        <Badge 
          variant={selectedVersion === 'enhanced' ? 'default' : 'secondary'}
          className="flex items-center gap-1"
        >
          {selectedVersion === 'enhanced' ? (
            <>
              <Sparkles className="h-3 w-3" />
              Enhanced Selected
            </>
          ) : (
            <>
              <ImageIcon className="h-3 w-3" />
              Original Selected
            </>
          )}
        </Badge>
      </div>

      {/* Image Display Area */}
      <div className="relative mb-6">
        {/* Main Image Display */}
        <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
          <img
            src={currentImage.url}
            alt={currentImage.label}
            className="w-full h-full object-cover transition-all duration-300"
          />
          
          {/* Image Navigation Arrows */}
          <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => handleNavigateImage('prev')}
              disabled={currentImageIndex === 0}
              className="bg-white/90 hover:bg-white shadow-lg"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => handleNavigateImage('next')}
              disabled={currentImageIndex === images.length - 1}
              className="bg-white/90 hover:bg-white shadow-lg"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Image Indicator */}
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-white/90 text-gray-800">
              {currentImage.label}
            </Badge>
          </div>

          {/* Selection Indicator */}
          {selectedVersion === currentImage.type && (
            <div className="absolute top-4 right-4">
              <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Selected for Posting
              </Badge>
            </div>
          )}
        </div>

        {/* Image Description */}
        <div className="mt-3 text-center">
          <p className="text-sm text-muted-foreground">
            {currentImage.description}
          </p>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mb-6">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentImageIndex === index 
                ? 'bg-primary w-6' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`View ${images[index].label}`}
          />
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Select Current Image Button */}
        <Button
          onClick={handleSelectCurrentImage}
          variant={selectedVersion === currentImage.type ? "default" : "outline"}
          className="flex items-center gap-2 flex-1"
        >
          {selectedVersion === currentImage.type ? (
            <>
              <Check className="h-4 w-4" />
              Selected for Posting
            </>
          ) : (
            <>
              <Mouse className="h-4 w-4" />
              Use This Image
            </>
          )}
        </Button>

        {/* Regenerate Button (only for enhanced image) */}
        {canRegenerate && (
          <Button
            onClick={handleRegenerate}
            variant="outline"
            disabled={isRegenerating}
            className="flex items-center gap-2"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate ({enhancement.max_regenerations - enhancement.regeneration_count} left)
              </>
            )}
          </Button>
        )}
      </div>

      {/* Enhancement History (if multiple versions exist) */}
      {enhancement.regeneration_count > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <History className="h-4 w-4" />
            <span>
              Enhanced {enhancement.regeneration_count + 1} time(s) 
              ({enhancement.max_regenerations - enhancement.regeneration_count} regenerations remaining)
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default EnhancementSelectionCard; 
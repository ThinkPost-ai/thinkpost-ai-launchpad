import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { 
  Edit, 
  Wand2,
  Loader2,
  X,
  Check,
  Trash2,
  Sparkles,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  ImageIcon
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CaptionData } from './types';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CaptionGridCardProps {
  caption: CaptionData;
  onCaptionUpdate: (id: string, newCaption: string) => void;
  onRegenerateCaption: (itemId: string, itemType: 'image' | 'product') => void;
  onDeleteCaption: (itemId: string, itemType: 'image' | 'product') => void;
  generatingCaption: string | null;
  userCredits: number;
}

const CaptionGridCard = ({ 
  caption, 
  onCaptionUpdate, 
  onRegenerateCaption,
  onDeleteCaption,
  generatingCaption,
  userCredits
}: CaptionGridCardProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [enhancementStatus, setEnhancementStatus] = useState(caption.image_enhancement_status || 'none');
  const [enhancedImagePath, setEnhancedImagePath] = useState(caption.enhanced_image_path || null);
  const [selectedVersion, setSelectedVersion] = useState<'original' | 'enhanced'>(() => {
    // Load saved selection from localStorage
    const saved = localStorage.getItem('selectedImageVersions');
    const savedVersions = saved ? JSON.parse(saved) : {};
    const savedVersion = savedVersions[caption.id];
    
    // If there's a saved version, use it
    if (savedVersion) return savedVersion;
    
    // Default to enhanced if available, otherwise original
    return (caption.image_enhancement_status === 'completed' && caption.enhanced_image_path) ? 'enhanced' : 'original';
  });
  const [isMarkedForEnhancement, setIsMarkedForEnhancement] = useState(() => {
    const enhancingProducts = JSON.parse(localStorage.getItem('enhancingProducts') || '[]');
    return enhancingProducts.includes(caption.id);
  });
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  console.log('CaptionGridCard render:', {
    id: caption.id,
    enhancementStatus,
    enhancedImagePath,
    isMarkedForEnhancement,
    isEnhancing
  });
  
  const shouldShowEnhancing = enhancementStatus === 'processing' || 
    isMarkedForEnhancement || isEnhancing;

  const canShowEnhanced = enhancementStatus === 'completed' && enhancedImagePath;

  const getImageUrl = (filePath: string) => {
    return `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${filePath}`;
  };

  // Polling for enhancement status updates
  useEffect(() => {
    if (enhancementStatus === 'processing') {
      const pollEnhancement = setInterval(async () => {
        try {
          if (caption.type === 'product') {
            const { data, error } = await supabase
              .from('products')
              .select('enhanced_image_path, image_enhancement_status')
              .eq('id', caption.id)
              .single();

            if (error) {
              console.error('Error polling enhancement status:', error);
              return;
            }

            if (data) {
              setEnhancementStatus(data.image_enhancement_status as 'none' | 'processing' | 'completed' | 'failed');
              setEnhancedImagePath(data.enhanced_image_path);
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000);

      return () => clearInterval(pollEnhancement);
    }
  }, [enhancementStatus, caption.id]);

  // Function to get the appropriate image path (enhanced or original)
  const getDisplayImagePath = () => {
    if (selectedVersion === 'enhanced' && canShowEnhanced) {
      return enhancedImagePath || caption.enhanced_image_path;
    }
    return caption.image_path;
  };

  // Navigation handlers
  const handlePreviousVersion = async () => {
    if (selectedVersion === 'enhanced') {
      const newVersion = 'original';
      setSelectedVersion(newVersion);
      
      // Store in localStorage for immediate UI responsiveness
      const saved = localStorage.getItem('selectedImageVersions');
      const savedVersions = saved ? JSON.parse(saved) : {};
      savedVersions[caption.id] = newVersion;
      localStorage.setItem('selectedImageVersions', JSON.stringify(savedVersions));
      
      // Update database for persistent selection
      if (caption.type === 'product') {
        try {
          const { error } = await supabase
            .from('products')
            .update({ selected_version: newVersion })
            .eq('id', caption.id);
          
          if (error) {
            console.error('Failed to update selected version:', error);
          }
        } catch (error) {
          console.error('Error updating selected version:', error);
        }
      }
    }
  };

  const handleNextVersion = async () => {
    if (selectedVersion === 'original' && canShowEnhanced) {
      const newVersion = 'enhanced';
      setSelectedVersion(newVersion);
      
      // Store in localStorage for immediate UI responsiveness
      const saved = localStorage.getItem('selectedImageVersions');
      const savedVersions = saved ? JSON.parse(saved) : {};
      savedVersions[caption.id] = newVersion;
      localStorage.setItem('selectedImageVersions', JSON.stringify(savedVersions));
      
      // Update database for persistent selection
      if (caption.type === 'product') {
        try {
          const { error } = await supabase
            .from('products')
            .update({ selected_version: newVersion })
            .eq('id', caption.id);
          
          if (error) {
            console.error('Failed to update selected version:', error);
          }
        } catch (error) {
          console.error('Error updating selected version:', error);
        }
      }
    }
  };

  // Enhancement handler
  const handleEnhanceImage = async () => {
    if (caption.type !== 'product') return;
    
    console.log('Starting enhancement for product:', caption.id);
    setIsEnhancing(true);
    setEnhancementStatus('processing');
    
    // Mark as enhancing in localStorage
    const enhancingProducts = JSON.parse(localStorage.getItem('enhancingProducts') || '[]');
    if (!enhancingProducts.includes(caption.id)) {
      enhancingProducts.push(caption.id);
      localStorage.setItem('enhancingProducts', JSON.stringify(enhancingProducts));
      setIsMarkedForEnhancement(true);
    }

    try {
      const response = await fetch(`/functions/v1/enhance-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          productId: caption.id,
          imagePath: caption.image_path,
        }),
      });

      const result = await response.json();
      console.log('Enhancement response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Enhancement failed');
      }

      toast({
        title: 'Enhancement Started',
        description: 'Your image is being enhanced. This may take a few moments.',
      });

    } catch (error) {
      console.error('Enhancement error:', error);
      setIsEnhancing(false);
      setEnhancementStatus('failed');
      
      // Remove from localStorage on error
      const enhancingProducts = JSON.parse(localStorage.getItem('enhancingProducts') || '[]');
      const updatedList = enhancingProducts.filter((id: string) => id !== caption.id);
      localStorage.setItem('enhancingProducts', JSON.stringify(updatedList));
      setIsMarkedForEnhancement(false);

      toast({
        title: 'Enhancement Failed',
        description: 'Failed to enhance image. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Poll for enhancement status updates for processing images
  useEffect(() => {
    if (shouldShowEnhancing && caption.type === 'product') {
      console.log('Starting polling for product:', caption.id);
      
      const pollInterval = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('image_enhancement_status, enhanced_image_path')
            .eq('id', caption.id)
            .single();

          if (error) {
            console.error('Error polling enhancement status:', error);
            return;
          }

          console.log('Polling result:', data);
          const status = data?.image_enhancement_status || 'none';
          const path = data?.enhanced_image_path || null;
          
          // Enhancement completed
          if (status === 'completed') {
            console.log('Enhancement completed for:', caption.id);
            setEnhancementStatus(status);
            setEnhancedImagePath(path);
            setIsEnhancing(false);
            
            // Remove from localStorage when enhancement completes
            const enhancingProducts = JSON.parse(localStorage.getItem('enhancingProducts') || '[]');
            const updatedList = enhancingProducts.filter((id: string) => id !== caption.id);
            localStorage.setItem('enhancingProducts', JSON.stringify(updatedList));
            setIsMarkedForEnhancement(false);
            
            // Auto-switch to enhanced version
            const newVersion = 'enhanced';
            setSelectedVersion(newVersion);
            // Store in localStorage for persistence across navigation
            const saved = localStorage.getItem('selectedImageVersions');
            const savedVersions = saved ? JSON.parse(saved) : {};
            savedVersions[caption.id] = newVersion;
            localStorage.setItem('selectedImageVersions', JSON.stringify(savedVersions));
            
            clearInterval(pollInterval);
            
            toast({
              title: 'Enhancement Complete!',
              description: 'Your image has been successfully enhanced.',
            });
          } else if (status === 'failed') {
            console.log('Enhancement failed for:', caption.id);
            setEnhancementStatus(status);
            setIsEnhancing(false);
            
            // Remove from localStorage on failure
            const enhancingProducts = JSON.parse(localStorage.getItem('enhancingProducts') || '[]');
            const updatedList = enhancingProducts.filter((id: string) => id !== caption.id);
            localStorage.setItem('enhancingProducts', JSON.stringify(updatedList));
            setIsMarkedForEnhancement(false);
            
            clearInterval(pollInterval);
          } else if (status === 'processing') {
            setEnhancementStatus(status);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 3000); // Poll every 3 seconds

      return () => {
        console.log('Clearing polling interval for:', caption.id);
        clearInterval(pollInterval);
      };
    }
  }, [shouldShowEnhancing, caption.id, caption.type]);

  const startEditing = () => {
    setEditingCaption(caption.caption || '');
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditingCaption(null);
    setIsEditing(false);
  };

  const saveCaption = async () => {
    if (!editingCaption) return;

    try {
      const table = caption.type === 'product' ? 'products' : 'images';
      const { error: updateError } = await supabase
        .from(table)
        .update({ caption: editingCaption })
        .eq('id', caption.id);

      if (updateError) throw updateError;

      onCaptionUpdate(caption.id, editingCaption);

      toast({
        title: t('toast.success'),
        description: t('captions.updateSuccess')
      });

      cancelEditing();
    } catch (error) {
      toast({
        title: t('toast.error'),
        description: t('captions.updateError'),
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const table = caption.type === 'product' ? 'products' : 'images';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', caption.id);

      if (error) throw error;

      onDeleteCaption(caption.id, caption.type);

      toast({
        title: t('toast.success'),
        description: t('captions.deleteSuccess')
      });
    } catch (error) {
      toast({
        title: t('toast.error'),
        description: t('captions.deleteError'),
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-0">
        <div className="relative aspect-square w-full group">
          {caption.media_type === 'video' ? (
            <>
              <video
                src={getImageUrl(getDisplayImagePath())}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <PlayCircle className="h-12 w-12 text-white" />
              </div>
            </>
          ) : (
            <img
              src={getImageUrl(getDisplayImagePath())}
              alt={caption.name || caption.original_filename || 'Content'}
              className="w-full h-full object-cover"
            />
          )}
          
          {/* Image version navigation arrows - always visible on mobile */}
          {canShowEnhanced && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePreviousVersion}
                disabled={selectedVersion === 'original'}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-3 h-10 w-10 md:p-2 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation z-10"
              >
                <ChevronLeft className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNextVersion}
                disabled={selectedVersion === 'enhanced'}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-3 h-10 w-10 md:p-2 md:h-8 md:w-8 md:opacity-0 md:group-hover:opacity-100 transition-opacity touch-manipulation z-10"
              >
                <ChevronRight className="h-5 w-5 md:h-4 md:w-4" />
              </Button>
            </>
          )}
          
          {/* Enhancement status indicators */}
          {shouldShowEnhancing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white rounded-full p-2">
                <Loader2 className="h-6 w-6 text-vibrant-purple animate-spin" />
              </div>
            </div>
          )}
          
          {enhancementStatus === 'failed' && (
            <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
              <X className="h-4 w-4 text-white" />
            </div>
          )}

          {/* Status badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {caption.is_new && caption.type === 'product' && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                New
              </Badge>
            )}
            
            {/* Version indicator badge */}
            {canShowEnhanced && (
              <Badge variant={selectedVersion === 'enhanced' ? 'default' : 'secondary'} className="text-xs">
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
            )}
            
            {shouldShowEnhancing && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                Enhancing...
              </Badge>
            )}
            
            {enhancementStatus === 'failed' && (
              <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                Enhancement Failed
              </Badge>
            )}
          </div>

          {/* Navigation hint */}
          {canShowEnhanced && (
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Badge variant="secondary" className="text-xs">
                {selectedVersion === 'original' ? 'Next: Enhanced' : 'Prev: Original'}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Title and metadata */}
          <div>
            <h3 className="font-medium text-deep-blue dark:text-white truncate text-sm">
              {caption.name || caption.original_filename}
            </h3>
            <p className="text-xs text-muted-foreground">
              {caption.type === 'product' ? 'Product' : 'Image'} • {new Date(caption.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Caption */}
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-deep-blue dark:text-white">Caption:</h4>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editingCaption}
                  onChange={(e) => setEditingCaption(e.target.value)}
                  className="text-right min-h-[80px] text-xs"
                  dir="rtl"
                  placeholder="Enter caption..."
                />
                <div className="flex justify-end gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEditing}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveCaption}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 min-h-[60px]">
                {caption.caption ? (
                  <p className="text-xs text-right whitespace-pre-wrap break-words leading-relaxed" dir="rtl">
                    {caption.caption}
                  </p>
                ) : (
                  <span className="text-muted-foreground italic text-xs">
                    {t('captions.noCaption')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-2 pt-0">
        <div className="flex items-center gap-1 w-full">
          <Button 
            size="sm" 
            variant="outline"
            onClick={startEditing}
            disabled={isEditing}
            className="flex-1 text-xs h-7"
          >
            <Edit className="h-3 w-3" />
          </Button>
          
          {caption.type === 'product' && enhancementStatus !== 'completed' && !shouldShowEnhancing && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleEnhanceImage}
              className="flex-1 text-xs h-7 text-purple-600 hover:bg-purple-50"
            >
              <Sparkles className="h-3 w-3" />
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onRegenerateCaption(caption.id, caption.type)}
            disabled={generatingCaption === caption.id || userCredits <= 0}
            title={userCredits <= 0 ? t('captions.noCredits') : t('captions.regenerateContent')}
            className="flex-1 text-xs h-7"
          >
            {generatingCaption === caption.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Wand2 className="h-3 w-3" />
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                disabled={deleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7"
              >
                {deleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('captions.confirmDelete')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('captions.confirmDeleteDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {t('captions.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CaptionGridCard; 
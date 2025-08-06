import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Edit, 
  Trash2, 
  Wand2, 
  X, 
  Check, 
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { useCaptionData } from './captions/useCaptionData';
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

interface GeneratedCaptionsProps {
  onCreditsUpdate?: () => void;
}

const EmptyCaptionsState = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="text-center py-12 space-y-6">
      <Wand2 className="h-16 w-16 text-muted-foreground mx-auto" />
      <div className="space-y-2">
        <h3 className="text-lg font-medium">{t('captions.noContent')}</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {t('captions.noContentDescription')}
        </p>
      </div>
      <Button 
        onClick={() => navigate('/upload')}
        className="bg-gradient-primary hover:opacity-90"
      >
        {t('captions.uploadFirst')}
      </Button>
    </div>
  );
};

const MobileGeneratedCaptions = ({ onCreditsUpdate }: GeneratedCaptionsProps) => {
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { 
    captions, 
    setCaptions, 
    loading, 
    userCredits, 
    setUserCredits,
    fetchCaptions 
  } = useCaptionData();
  
  const [generatingCaption, setGeneratingCaption] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Enhancement tracking states
  const [enhancingItems, setEnhancingItems] = useState<Set<string>>(new Set());
  const [enhancementStatuses, setEnhancementStatuses] = useState<{[key: string]: string}>({});
  const [enhancedPaths, setEnhancedPaths] = useState<{[key: string]: string}>({});
  const [selectedVersions, setSelectedVersions] = useState<{[key: string]: 'original' | 'enhanced'}>(() => {
    // Load saved selections from localStorage
    const saved = localStorage.getItem('selectedImageVersions');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Full-screen image preview states
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    isVideo: boolean;
    caption: any;
  } | null>(null);

  const getImageUrl = (filePath: string) => {
    return `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${filePath}`;
  };

  // Function to get the appropriate image path (enhanced or original)
  const getDisplayImagePath = (caption: any) => {
    const enhancedPath = enhancedPaths[caption.id] || caption.enhanced_image_path;
    const status = enhancementStatuses[caption.id] || caption.image_enhancement_status;
    const selectedVersion = selectedVersions[caption.id] || 'original';
    
    if (selectedVersion === 'enhanced' && enhancedPath && status === 'completed') {
      return enhancedPath;
    }
    return caption.image_path;
  };

  // Check if item can show enhanced version
  const canShowEnhanced = (captionId: string) => {
    const enhancedPath = enhancedPaths[captionId] || captions.find(c => c.id === captionId)?.enhanced_image_path;
    const status = enhancementStatuses[captionId] || captions.find(c => c.id === captionId)?.image_enhancement_status;
    return status === 'completed' && enhancedPath;
  };

  // Navigation handlers for image versions
  const handleVersionChange = async (captionId: string, version: 'original' | 'enhanced') => {
    setSelectedVersions(prev => {
      const updated = { ...prev, [captionId]: version };
      // Store in localStorage for persistence across navigation
      localStorage.setItem('selectedImageVersions', JSON.stringify(updated));
      return updated;
    });
    
    // Update database for persistent selection
    const caption = captions.find(c => c.id === captionId);
    if (caption?.type === 'product') {
      try {
        const { error } = await supabase
          .from('products')
          .update({ selected_version: version })
          .eq('id', captionId);
        
        if (error) {
          console.error('Failed to update selected version:', error);
        }
      } catch (error) {
        console.error('Error updating selected version:', error);
      }
    }
  };

  // Full-screen image preview handler
  const openImagePreview = (caption: any) => {
    const imageUrl = getImageUrl(getDisplayImagePath(caption));
    setPreviewImage({
      url: imageUrl,
      isVideo: caption.media_type === 'video',
      caption: caption
    });
  };

  const closeImagePreview = () => {
    setPreviewImage(null);
  };

  // Handle keyboard events for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && previewImage) {
        closeImagePreview();
      }
    };

    if (previewImage) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [previewImage]);

  // Check if item is currently enhancing
  const isItemEnhancing = (captionId: string) => {
    return enhancingItems.has(captionId) || enhancementStatuses[captionId] === 'processing';
  };

  // Initialize enhancement states from localStorage and database
  useEffect(() => {
    const enhancingProducts = JSON.parse(localStorage.getItem('enhancingProducts') || '[]');
    if (enhancingProducts.length > 0) {
      setEnhancingItems(new Set(enhancingProducts));
    }

    // Initialize enhancement statuses from captions data
    const initialStatuses: {[key: string]: string} = {};
    const initialPaths: {[key: string]: string} = {};
    const initialVersions: {[key: string]: 'original' | 'enhanced'} = {};
    
    captions.forEach(caption => {
      if (caption.image_enhancement_status) {
        initialStatuses[caption.id] = caption.image_enhancement_status;
      }
      if (caption.enhanced_image_path) {
        initialPaths[caption.id] = caption.enhanced_image_path;
        // Auto-select enhanced version if available and completed
        if (caption.image_enhancement_status === 'completed') {
          initialVersions[caption.id] = 'enhanced';
        }
      }
    });
    
    setEnhancementStatuses(initialStatuses);
    setEnhancedPaths(initialPaths);
    setSelectedVersions(prev => ({ ...prev, ...initialVersions }));
  }, [captions]);

  // Polling mechanism for enhancement status
  useEffect(() => {
    const enhancingIds = Array.from(enhancingItems).filter(id => 
      captions.some(caption => caption.id === id)
    );

    if (enhancingIds.length === 0) return;

    console.log('Starting polling for enhancing items:', enhancingIds);

    const pollInterval = setInterval(async () => {
      for (const itemId of enhancingIds) {
        try {
          const caption = captions.find(c => c.id === itemId);
          if (!caption) continue;

          const table = caption.type === 'product' ? 'products' : 'images';
          const { data, error } = await supabase
            .from(table)
            .select('enhanced_image_path, image_enhancement_status')
            .eq('id', itemId)
            .single();

          if (error) {
            console.error('Polling error for', itemId, ':', error);
            continue;
          }

          const status = (data as any)?.image_enhancement_status || 'none';
          const path = (data as any)?.enhanced_image_path;

          console.log(`Polling ${itemId}: status=${status}, path=${path}`);

          setEnhancementStatuses(prev => ({ ...prev, [itemId]: status }));
          if (path) {
            setEnhancedPaths(prev => ({ ...prev, [itemId]: path }));
          }

          if (status === 'completed') {
            console.log('Enhancement completed for:', itemId);
            setEnhancingItems(prev => {
              const newSet = new Set(prev);
              newSet.delete(itemId);
              return newSet;
            });

            // Remove from localStorage
            const enhancingProducts = JSON.parse(localStorage.getItem('enhancingProducts') || '[]');
            const updatedList = enhancingProducts.filter((id: string) => id !== itemId);
            localStorage.setItem('enhancingProducts', JSON.stringify(updatedList));

            // Auto-switch to enhanced version when enhancement completes
            setSelectedVersions(prev => ({ ...prev, [itemId]: 'enhanced' }));

            // Refresh captions data to get the updated image paths
            setTimeout(async () => {
              await fetchCaptions(); // Refresh the captions data
            }, 1000);

            toast({
              title: 'Enhancement Complete! ✨',
              description: `Your ${caption.type} image has been enhanced and will update shortly.`,
            });
          } else if (status === 'failed') {
            console.log('Enhancement failed for:', itemId);
            setEnhancingItems(prev => {
              const newSet = new Set(prev);
              newSet.delete(itemId);
              return newSet;
            });

            // Remove from localStorage
            const enhancingProducts = JSON.parse(localStorage.getItem('enhancingProducts') || '[]');
            const updatedList = enhancingProducts.filter((id: string) => id !== itemId);
            localStorage.setItem('enhancingProducts', JSON.stringify(updatedList));

            toast({
              title: 'Enhancement Failed',
              description: `Enhancement failed for your ${caption.type}.`,
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Polling error for', itemId, ':', error);
        }
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      console.log('Clearing polling interval');
      clearInterval(pollInterval);
    };
  }, [enhancingItems, captions, toast, fetchCaptions]);

  const regenerateCaption = async (itemId: string, itemType: 'image' | 'product') => {
    // Check credits before attempting to generate
    if (userCredits <= 0) {
      toast({
        title: t('captions.noCredits'),
        description: t('captions.noCreditsDescription'),
        variant: "destructive"
      });
      return;
    }

    setGeneratingCaption(itemId);
    
    try {
      let requestBody;
      if (itemType === 'product') {
        const product = captions.find(c => c.id === itemId && c.type === 'product');
        requestBody = {
          productName: product?.name || 'وجبة مميزة',
          price: product?.price,
          description: product?.description,
          contentType: 'product',
          contentCategory: null
        };
      } else {
        const image = captions.find(c => c.id === itemId && c.type === 'image');
        requestBody = { 
          productName: null,
          price: null,
          description: image?.description || '',
          contentType: image?.content_type ? 'general' : 'product', // If content_type exists, it's general content
          contentCategory: image?.content_type || null
        };
      }

      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: requestBody
      });

      if (error) {
        if (error.message?.includes('Insufficient caption credits') || error.message?.includes('402')) {
          toast({
            title: t('captions.noCredits'),
            description: t('captions.noCreditsDescription'),
            variant: "destructive"
          });
          setUserCredits(0);
          onCreditsUpdate?.();
          return;
        }
        throw error;
      }

      const newCaption = data.caption;
      
      // Update the database
      const table = itemType === 'product' ? 'products' : 'images';
      
      const { error: updateError } = await supabase
        .from(table)
        .update({ caption: newCaption })
        .eq('id', itemId);

      if (updateError) throw updateError;
      
      // Update the local state
      setCaptions(prev => prev.map(caption => 
        caption.id === itemId ? { ...caption, caption: newCaption } : caption
      ));
      
      // Update credits count
      setUserCredits(prev => Math.max(0, prev - 1));
      onCreditsUpdate?.();
      
      toast({
        title: t('toast.success'),
        description: t('captions.regenerateSuccess')
      });
    } catch (error: any) {
      toast({
        title: t('toast.error'),
        description: t('captions.regenerateError'),
        variant: "destructive"
      });
    } finally {
      setGeneratingCaption(null);
    }
  };

  const startEditing = (caption: any) => {
    setEditingCaption(caption.caption || '');
    setCurrentEditId(caption.id);
  };

  const cancelEditing = () => {
    setEditingCaption(null);
    setCurrentEditId(null);
  };

  const saveCaption = async (captionData: any) => {
    if (!editingCaption) return;

    try {
      const table = captionData.type === 'product' ? 'products' : 'images';
      const { error: updateError } = await supabase
        .from(table)
        .update({ caption: editingCaption })
        .eq('id', captionData.id);

      if (updateError) throw updateError;

      setCaptions(prev => prev.map(caption =>
        caption.id === captionData.id ? { ...caption, caption: editingCaption } : caption
      ));

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

  const handleDelete = async (captionData: any) => {
    setDeleting(captionData.id);
    try {
      const table = captionData.type === 'product' ? 'products' : 'images';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', captionData.id);

      if (error) throw error;

      setCaptions(prev => prev.filter(caption => caption.id !== captionData.id));

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
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibrant-purple"></div>
      </div>
    );
  }

  if (captions.length === 0) {
    return <EmptyCaptionsState />;
  }

  return (
    <div className="space-y-4 pb-6">
      {captions.map((caption) => (
        <Card key={`${caption.type}-${caption.id}`} className="p-4">
          {/* Image Section */}
          <div className="w-full mb-4">
            <div className="relative">
              {caption.media_type === 'video' ? (
                <video
                  src={getImageUrl(getDisplayImagePath(caption))}
                  className="w-full h-64 object-cover rounded-lg cursor-pointer"
                  controls
                  muted
                  onClick={() => openImagePreview(caption)}
                />
              ) : (
                <img
                  src={getImageUrl(getDisplayImagePath(caption))}
                  alt={caption.name || caption.original_filename || 'Content'}
                  className="w-full h-64 object-cover rounded-lg cursor-pointer"
                  onClick={() => openImagePreview(caption)}
                />
              )}
              
              {/* Version Badge */}
              <div className="absolute top-2 left-2">
                <div className="flex items-center gap-1 bg-black/70 rounded-full px-2 py-1">
                  {(selectedVersions[caption.id] || 'original') === 'enhanced' ? (
                    <>
                      <Sparkles className="h-3 w-3 text-yellow-400" />
                      <span className="text-xs text-white font-medium">Enhanced</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-3 w-3 text-gray-300" />
                      <span className="text-xs text-white font-medium">Original</span>
                    </>
                  )}
                </div>
              </div>

              {/* Navigation Arrows - only show if enhanced version is available */}
              {canShowEnhanced(caption.id) && (
                <>
                  <button
                    onClick={() => handleVersionChange(caption.id, 'original')}
                    disabled={(selectedVersions[caption.id] || 'original') === 'original'}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/70 text-white rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/80 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleVersionChange(caption.id, 'enhanced')}
                    disabled={(selectedVersions[caption.id] || 'original') === 'enhanced'}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/70 text-white rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/80 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
              
              {/* Enhancement loading overlay */}
              {isItemEnhancing(caption.id) && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="bg-white/90 rounded-lg p-4 flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">Enhancing Image...</div>
                      <div className="text-gray-600">This may take a few minutes</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Enhancement status indicators */}
              {enhancementStatuses[caption.id] === 'completed' && enhancedPaths[caption.id] && (
                <div className="absolute top-2 right-2 bg-yellow-500 rounded-full p-1">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              )}
              
              {enhancementStatuses[caption.id] === 'failed' && (
                <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                  <X className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            
            <div className="mt-2">
              <h3 className="font-medium text-sm text-foreground">
                {caption.name || caption.original_filename}
              </h3>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {new Date(caption.created_at).toLocaleDateString()}
                </p>
                {enhancementStatuses[caption.id] === 'completed' && enhancedPaths[caption.id] && (
                  <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Enhanced Available
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-foreground">
              {t('captions.content')}
            </label>
            {currentEditId === caption.id ? (
              <div className="space-y-3">
                <Textarea
                  value={editingCaption}
                  onChange={(e) => setEditingCaption(e.target.value)}
                  className={`min-h-[120px] ${isRTL ? 'text-right' : 'text-left'}`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  placeholder={t('captions.editPlaceholder')}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEditing}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t('common.cancel')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveCaption(caption)}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {t('captions.save')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className={`p-3 border rounded-md bg-muted/30 min-h-[120px] ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                {caption.caption ? (
                  <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
                    {caption.caption}
                  </p>
                ) : (
                  <span className="text-muted-foreground italic text-sm">
                    {t('captions.noCaption')}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {currentEditId !== caption.id && (
            <div className="grid grid-cols-3 gap-3">
              <Button 
                variant="outline"
                onClick={() => startEditing(caption)}
                className="flex items-center justify-center gap-2 py-3"
              >
                <Edit className="h-4 w-4" />
                <span className="text-sm">{t('captions.editContent')}</span>
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    disabled={generatingCaption === caption.id || userCredits <= 0}
                    className="flex items-center justify-center gap-2 py-3"
                    title={userCredits <= 0 ? t('captions.noCredits') : t('captions.regenerateContent')}
                  >
                    {generatingCaption === caption.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    <span className="text-sm">{t('captions.regenerateContent')}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('captions.confirmRegenerate')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('captions.confirmRegenerateDescription')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => regenerateCaption(caption.id, caption.type)}>
                      {t('captions.approve')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    disabled={deleting === caption.id}
                    className="flex items-center justify-center gap-2 py-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleting === caption.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="text-sm">{t('captions.delete')}</span>
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
                      onClick={() => handleDelete(caption)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {t('captions.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </Card>
      ))}

      {/* Fixed Next Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t z-50">
        <Button 
          onClick={() => navigate('/schedule')}
          className="w-full bg-gradient-primary hover:opacity-90 py-4 text-base font-medium"
          size="lg"
        >
          {t('captions.next')}
        </Button>
      </div>

      {/* Full-Screen Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={closeImagePreview}
        >
          <div className="relative max-w-full max-h-full">
            {/* Close button */}
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Version badge */}
            <div className="absolute top-4 left-4 z-10">
              <div className="flex items-center gap-1 bg-black/70 rounded-full px-3 py-1">
                {(selectedVersions[previewImage.caption.id] || 'original') === 'enhanced' ? (
                  <>
                    <Sparkles className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm text-white font-medium">Enhanced</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 text-gray-300" />
                    <span className="text-sm text-white font-medium">Original</span>
                  </>
                )}
              </div>
            </div>

            {/* Navigation arrows in full-screen mode */}
            {canShowEnhanced(previewImage.caption.id) && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVersionChange(previewImage.caption.id, 'original');
                    // Update preview image URL
                    const newImageUrl = getImageUrl(getDisplayImagePath(previewImage.caption));
                    setPreviewImage(prev => prev ? { ...prev, url: newImageUrl } : null);
                  }}
                  disabled={(selectedVersions[previewImage.caption.id] || 'original') === 'original'}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white rounded-full p-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/80 transition-colors z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVersionChange(previewImage.caption.id, 'enhanced');
                    // Update preview image URL
                    const newImageUrl = getImageUrl(getDisplayImagePath(previewImage.caption));
                    setPreviewImage(prev => prev ? { ...prev, url: newImageUrl } : null);
                  }}
                  disabled={(selectedVersions[previewImage.caption.id] || 'original') === 'enhanced'}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 text-white rounded-full p-3 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black/80 transition-colors z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Full-screen image/video */}
            <div 
              className="max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {previewImage.isVideo ? (
                <video
                  src={previewImage.url}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                />
              ) : (
                <img
                  src={previewImage.url}
                  alt={previewImage.caption.name || previewImage.caption.original_filename || 'Content'}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>

            {/* Image info at bottom */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-lg p-3 text-white">
              <h3 className="font-medium text-sm mb-1">
                {previewImage.caption.name || previewImage.caption.original_filename}
              </h3>
              <p className="text-xs text-gray-300">
                {new Date(previewImage.caption.created_at).toLocaleDateString()}
              </p>
              {enhancementStatuses[previewImage.caption.id] === 'completed' && enhancedPaths[previewImage.caption.id] && (
                <span className="text-xs text-yellow-400 font-medium flex items-center gap-1 mt-1">
                  <Sparkles className="h-3 w-3" />
                  Enhanced Version Available
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileGeneratedCaptions;
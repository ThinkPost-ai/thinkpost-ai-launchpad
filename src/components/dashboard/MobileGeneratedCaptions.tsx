import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Edit, 
  Wand2,
  Loader2,
  X,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCaptionData } from './captions/useCaptionData';
import { GeneratedCaptionsProps } from './captions/types';
import EmptyCaptionsState from './captions/EmptyCaptionsState';
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
import { useNavigate } from 'react-router-dom';

const MobileGeneratedCaptions = ({ onCreditsUpdate }: GeneratedCaptionsProps) => {
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { 
    captions, 
    setCaptions, 
    loading, 
    userCredits, 
    setUserCredits 
  } = useCaptionData();
  
  const [generatingCaption, setGeneratingCaption] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);

  const getImageUrl = (filePath: string) => {
    return `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${filePath}`;
  };

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
            <img
              src={getImageUrl(caption.image_path)}
              alt={caption.name || caption.original_filename || 'Content'}
              className="w-full h-64 object-cover rounded-lg"
            />
            <div className="mt-2">
              <h3 className="font-medium text-sm text-foreground">
                {caption.name || caption.original_filename}
              </h3>
              <p className="text-xs text-muted-foreground">
                {new Date(caption.created_at).toLocaleDateString()}
              </p>
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
            <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
};

export default MobileGeneratedCaptions;
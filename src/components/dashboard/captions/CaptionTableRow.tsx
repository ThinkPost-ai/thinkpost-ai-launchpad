import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { TableCell, TableRow } from '@/components/ui/table';
import { 
  Edit, 
  Play, 
  Wand2,
  Loader2,
  X,
  Check,
  Trash2,
  Sparkles
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

interface CaptionTableRowProps {
  caption: CaptionData;
  onCaptionUpdate: (id: string, newCaption: string) => void;
  onRegenerateCaption: (itemId: string, itemType: 'image' | 'product') => void;
  onDeleteCaption: (itemId: string, itemType: 'image' | 'product') => void;
  generatingCaption: string | null;
  userCredits: number;
}

const CaptionTableRow = ({ 
  caption, 
  onCaptionUpdate, 
  onRegenerateCaption,
  onDeleteCaption,
  generatingCaption,
  userCredits
}: CaptionTableRowProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [enhancementStatus, setEnhancementStatus] = useState(caption.image_enhancement_status || 'none');
  const [enhancedImagePath, setEnhancedImagePath] = useState(caption.enhanced_image_path || null);
  const [isMarkedForEnhancement, setIsMarkedForEnhancement] = useState(() => {
    const enhancingProducts = JSON.parse(localStorage.getItem('enhancingProducts') || '[]');
    return enhancingProducts.includes(caption.id);
  });
  
  const shouldShowEnhancing = enhancementStatus === 'processing' || 
    (isMarkedForEnhancement && enhancementStatus === 'none' && caption.type === 'product');

  const getImageUrl = (filePath: string) => {
    return `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${filePath}`;
  };

  // Poll for enhancement status updates for processing images
  useEffect(() => {
    if (shouldShowEnhancing && caption.type === 'product') {
      const pollInterval = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', caption.id)
            .single();

          if (error) {
            console.error('Error polling enhancement status:', error);
            return;
          }

          // Check if enhancement columns exist and update accordingly
          const status = (data as any).image_enhancement_status || 'none';
          const path = (data as any).enhanced_image_path || null;
          
          if (status !== 'processing' && status !== 'none') {
            setEnhancementStatus(status);
            setEnhancedImagePath(path);
            
            // Remove from localStorage when enhancement completes
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

      return () => clearInterval(pollInterval);
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
    <TableRow>
      <TableCell className="text-center">
        <div className="flex items-center gap-3 justify-center">
          <div className="relative">
            {caption.media_type === 'video' ? (
              <video
                src={enhancedImagePath ? getImageUrl(enhancedImagePath) : getImageUrl(caption.image_path)}
                className="h-12 w-12 object-cover rounded-md"
                muted
              />
            ) : (
              <img
                src={enhancedImagePath ? getImageUrl(enhancedImagePath) : getImageUrl(caption.image_path)}
                alt={caption.name || caption.original_filename || 'Content'}
                className="h-12 w-12 object-cover rounded-md"
              />
            )}
            
            {/* Enhancement status indicators */}
            {shouldShowEnhancing && (
              <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              </div>
            )}
            
            {enhancementStatus === 'completed' && enhancedImagePath && (
              <div className="absolute -top-1 -right-1">
                <Sparkles className="h-3 w-3 text-yellow-500" />
              </div>
            )}
            
            {enhancementStatus === 'failed' && (
              <div className="absolute -top-1 -right-1">
                <X className="h-3 w-3 text-red-500" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-deep-blue dark:text-white">
                {caption.name || caption.original_filename}
              </p>
              {caption.is_new && caption.type === 'product' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-2 py-1">
                  New
                </Badge>
              )}
              {shouldShowEnhancing && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                  Enhancing...
                </Badge>
              )}
              {enhancementStatus === 'completed' && enhancedImagePath && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1">
                  Enhanced
                </Badge>
              )}
              {enhancementStatus === 'failed' && (
                <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs px-2 py-1">
                  Enhancement Failed
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {caption.type === 'product' ? 'Product' : 'Image'} • {new Date(caption.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={editingCaption}
              onChange={(e) => setEditingCaption(e.target.value)}
              className="text-right min-h-[100px]"
              dir="rtl"
            />
            <div className="flex justify-end gap-2">
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
          <div className="text-sm text-center max-w-md mx-auto">
            {caption.caption ? (
              <p className="text-right whitespace-pre-wrap break-words leading-relaxed" dir="rtl">
                {caption.caption}
              </p>
            ) : (
              <span className="text-muted-foreground italic">
                {t('captions.noCaption')}
              </span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center gap-2 justify-center">
          <Button 
            size="sm" 
            variant="outline"
            onClick={startEditing}
            disabled={isEditing}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onRegenerateCaption(caption.id, caption.type)}
            disabled={generatingCaption === caption.id || userCredits <= 0}
            title={userCredits <= 0 ? t('captions.noCredits') : t('captions.regenerateContent')}
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
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      </TableCell>
    </TableRow>
  );
};

export default CaptionTableRow;

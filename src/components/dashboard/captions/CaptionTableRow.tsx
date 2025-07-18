import { useState } from 'react';
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
  Trash2
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

  const getImageUrl = (filePath: string) => {
    return `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${filePath}`;
  };

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
          {caption.media_type === 'video' ? (
            <video
              src={getImageUrl(caption.image_path)}
              className="h-12 w-12 object-cover rounded-md"
              muted
            />
          ) : (
            <img
              src={getImageUrl(caption.image_path)}
              alt={caption.name || caption.original_filename || 'Content'}
              className="h-12 w-12 object-cover rounded-md"
            />
          )}
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

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
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { CaptionData } from './types';

interface CaptionTableRowProps {
  caption: CaptionData;
  onCaptionUpdate: (id: string, newCaption: string) => void;
  onRegenerateCaption: (itemId: string, itemType: 'image' | 'product') => void;
  generatingCaption: string | null;
  userCredits: number;
}

const CaptionTableRow = ({ 
  caption, 
  onCaptionUpdate, 
  onRegenerateCaption,
  generatingCaption,
  userCredits
}: CaptionTableRowProps) => {
  const { toast } = useToast();
  const { isRTL } = useLanguage();
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
        title: "Success",
        description: "Caption updated successfully"
      });

      cancelEditing();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update caption",
        variant: "destructive"
      });
    }
  };

  return (
    <TableRow>
      <TableCell className="text-center">
        <div className="flex items-center gap-3 justify-center">
          <img
            src={getImageUrl(caption.image_path)}
            alt={caption.name || caption.original_filename || 'Content'}
            className="h-12 w-12 object-cover rounded-md"
          />
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
      <TableCell className="max-w-xs text-center">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={editingCaption}
              onChange={(e) => setEditingCaption(e.target.value)}
              className={`${isRTL ? 'text-right' : 'text-left'} min-h-[100px]`}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
            <div className="flex gap-2 justify-center">
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
          <p className="text-sm line-clamp-3 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
            {caption.caption || (
              <span className="text-muted-foreground italic">
                No caption generated yet
              </span>
            )}
          </p>
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
            title={userCredits <= 0 ? "No caption credits remaining" : "Regenerate caption"}
          >
            {generatingCaption === caption.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Wand2 className="h-3 w-3" />
            )}
          </Button>
          {caption.status === 'draft' && (
            <Button size="sm" className="bg-gradient-primary hover:opacity-90">
              <Play className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

export default CaptionTableRow;

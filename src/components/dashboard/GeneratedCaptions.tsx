
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare, Calendar, Trash2, CheckSquare, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCaptionData } from './captions/useCaptionData';
import { GeneratedCaptionsProps } from './captions/types';
import EmptyCaptionsState from './captions/EmptyCaptionsState';
import MobileGeneratedCaptions from './MobileGeneratedCaptions';
import { useIsMobile } from '@/hooks/use-mobile';
import CaptionGridCard from './captions/CaptionGridCard';
import { useImageCompression } from '@/hooks/useImageCompression';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const GeneratedCaptions = ({ onCreditsUpdate }: GeneratedCaptionsProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { 
    captions, 
    setCaptions, 
    loading, 
    userCredits, 
    setUserCredits 
  } = useCaptionData();
  
  const [generatingCaption, setGeneratingCaption] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const regenerateCaption = async (itemId: string, itemType: 'image' | 'product') => {
    // Check credits before attempting to generateccc
    if (userCredits <= 0) {
      toast({
        title: "No Remaining Credits",
        description: "You have 0 caption credits remaining. You've reached your monthly limit.",
        variant: "destructive"
      });
      return;
    }

    console.log('Starting regenerateCaption for:', { itemId, itemType, userCredits });

    setGeneratingCaption(itemId);
    
    try {
      let requestBody;
      if (itemType === 'product') {
        const product = captions.find(c => c.id === itemId && c.type === 'product');
        console.log('Found product:', product);
        requestBody = {
          productName: product?.name || 'وجبة مميزة',
          price: product?.price,
          description: product?.description,
          contentType: 'product',
          contentCategory: null
        };
      } else {
        const image = captions.find(c => c.id === itemId && c.type === 'image');
        console.log('Found image:', image);
        requestBody = { 
          productName: null,
          price: null,
          description: image?.description || '',
          contentType: image?.content_type ? 'general' : 'product', // If content_type exists, it's general content
          contentCategory: image?.content_type || null
        };
      }

      console.log('Sending request to generate-caption with body:', requestBody);

      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: requestBody
      });

      console.log('Response from generate-caption:', { data, error });

      if (error) {
        console.error('Error from generate-caption function:', error);
        if (error.message?.includes('Insufficient caption credits') || error.message?.includes('402')) {
          toast({
            title: "No Remaining Credits",
            description: "You have 0 caption credits remaining. You've reached your monthly limit.",
            variant: "destructive"
          });
          // Update local credits state
          setUserCredits(0);
          // Trigger credits update in parent component
          onCreditsUpdate?.();
          return;
        }
        throw error;
      }

      const newCaption = data.caption;
      console.log('Generated caption:', newCaption);
      
      // Update the database
      const table = itemType === 'product' ? 'products' : 'images';
      console.log('Updating table:', table, 'with caption for ID:', itemId);
      
      const { error: updateError } = await supabase
        .from(table)
        .update({ caption: newCaption })
        .eq('id', itemId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }
      
      // Update the local state
      setCaptions(prev => prev.map(caption => 
        caption.id === itemId ? { ...caption, caption: newCaption } : caption
      ));
      
      // Update credits count
      setUserCredits(prev => Math.max(0, prev - 1));
      
      // Trigger credits update in parent component
      onCreditsUpdate?.();
      
      console.log('Caption regeneration completed successfully');
      
      toast({
        title: "Success!",
        description: "Caption generated successfully"
      });
    } catch (error: any) {
      console.error('Caption regeneration error:', error);
      toast({
        title: "Error",
        description: "Failed to generate caption",
        variant: "destructive"
      });
    } finally {
      setGeneratingCaption(null);
    }
  };

  const handleCaptionUpdate = (id: string, newCaption: string) => {
    setCaptions(prev => prev.map(caption =>
      caption.id === id ? { ...caption, caption: newCaption } : caption
    ));
  };

  const handleCaptionDelete = (id: string, type: 'image' | 'product') => {
    setCaptions(prev => prev.filter(caption => caption.id !== id));
  };

  const handleSelectionChange = (id: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === captions.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(captions.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const deletePromises = Array.from(selectedItems).map(async (id) => {
        const caption = captions.find(c => c.id === id);
        if (!caption) return;
        
        const table = caption.type === 'product' ? 'products' : 'images';
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      });

      await Promise.all(deletePromises);

      setCaptions(prev => prev.filter(caption => !selectedItems.has(caption.id)));
      setSelectedItems(new Set());
      setSelectionMode(false);
      setShowDeleteDialog(false);

      toast({
        title: t('toast.success'),
        description: `Successfully deleted ${selectedItems.size} item(s)`,
      });
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: t('toast.error'),
        description: 'Failed to delete some items',
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibrant-purple"></div>
      </div>
    );
  }

  // Use mobile layout for mobile devices
  if (isMobile) {
    return <MobileGeneratedCaptions onCreditsUpdate={onCreditsUpdate} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-vibrant-purple" />
                {t('captions.title')}
              </CardTitle>
              <CardDescription>
                {t('captions.description')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {captions.length > 0 && (
                <Button 
                  variant={selectionMode ? "secondary" : "outline"}
                  onClick={() => {
                    setSelectionMode(!selectionMode);
                    setSelectedItems(new Set());
                  }}
                  size="sm"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {selectionMode ? 'Cancel Selection' : 'Select Multiple'}
                </Button>
              )}
              <Button 
                onClick={() => window.location.href = '/schedule'}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t('captions.schedule')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions Toolbar */}
          {selectionMode && captions.length > 0 && (
            <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedItems.size === captions.length ? (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Select All
                      </>
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.size} of {captions.length} selected
                  </span>
                </div>
                {selectedItems.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected ({selectedItems.size})
                  </Button>
                )}
              </div>
            </div>
          )}

          {captions.length === 0 ? (
            <EmptyCaptionsState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {captions.map((caption) => (
                <CaptionGridCard
                  key={`${caption.type}-${caption.id}`}
                  caption={caption}
                  onCaptionUpdate={handleCaptionUpdate}
                  onRegenerateCaption={regenerateCaption}
                  onDeleteCaption={handleCaptionDelete}
                  generatingCaption={generatingCaption}
                  userCredits={userCredits}
                  selectionMode={selectionMode}
                  isSelected={selectedItems.has(caption.id)}
                  onSelectionChange={handleSelectionChange}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.size} item(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected posts and their captions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GeneratedCaptions;

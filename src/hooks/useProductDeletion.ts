
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MediaItem {
  id: string;
  file_path: string;
  type: 'image' | 'product';
}

export const useProductDeletion = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  };

  const selectAllItems = (items: MediaItem[]) => {
    const productIds = items.filter(item => item.type === 'product').map(item => item.id);
    setSelectedItems(new Set(productIds));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const deleteSelectedProducts = async (items: MediaItem[]) => {
    if (!user || selectedItems.size === 0) return;

    setDeleting(true);

    try {
      const selectedProducts = items.filter(item => 
        item.type === 'product' && selectedItems.has(item.id)
      );

      // Delete files from storage
      const filePaths = selectedProducts.map(product => product.file_path);
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('restaurant-images')
          .remove(filePaths);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Continue with database deletion even if storage fails
        }
      }

      // Delete products from database
      const productIds = Array.from(selectedItems);
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .in('id', productIds);

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: `${selectedItems.size} product(s) deleted successfully`
      });

      clearSelection();
      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete products",
        variant: "destructive"
      });
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const deleteAllProducts = async () => {
    if (!user) return;

    setDeleting(true);

    try {
      // Get all user's products to delete their files
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('image_path')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Delete files from storage
      if (products && products.length > 0) {
        const filePaths = products
          .map(product => product.image_path)
          .filter(path => path);

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('restaurant-images')
            .remove(filePaths);

          if (storageError) {
            console.error('Storage deletion error:', storageError);
            // Continue with database deletion even if storage fails
          }
        }
      }

      // Delete all products from database
      const { error: dbError } = await supabase
        .from('products')
        .delete()
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      toast({
        title: "Success!",
        description: "All products deleted successfully"
      });

      clearSelection();
      return true;
    } catch (error: any) {
      console.error('Delete all error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete all products",
        variant: "destructive"
      });
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return {
    deleting,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    deleteSelectedProducts,
    deleteAllProducts
  };
};


import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Grid3X3, 
  List, 
  Upload, 
  MessageSquare, 
  Filter,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useProductDeletion } from '@/hooks/useProductDeletion';
import { useLanguage } from '@/contexts/LanguageContext';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

interface MediaItem {
  id: string;
  file_path: string;
  original_filename?: string;
  name?: string;
  price?: number;
  description?: string;
  caption?: string;
  created_at: string;
  type: 'image' | 'product';
}

const MediaManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<string>('all');
  const [selectionMode, setSelectionMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteAllMode, setDeleteAllMode] = useState(false);

  const {
    deleting,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    deleteSelectedProducts,
    deleteAllProducts
  } = useProductDeletion();

  const getFilterTags = () => [
    { key: 'all', label: t('media.filterAll') },
    { key: 'images', label: t('media.filterImages') },
    { key: 'products', label: t('media.filterProducts') },
    { key: 'with captions', label: t('media.filterWithCaptions') },
    { key: 'without captions', label: t('media.filterWithoutCaptions') }
  ];

  useEffect(() => {
    fetchMediaItems();
  }, [user]);

  const fetchMediaItems = async () => {
    try {
      // Fetch images
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (imagesError) throw imagesError;

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      const transformedImages = (images || []).map(image => ({
        id: image.id,
        file_path: image.file_path,
        original_filename: image.original_filename,
        caption: image.caption,
        created_at: image.created_at,
        type: 'image' as const
      }));

      const transformedProducts = (products || []).map(product => ({
        id: product.id,
        file_path: product.image_path,
        name: product.name,
        price: product.price,
        description: product.description,
        caption: product.caption,
        created_at: product.created_at,
        type: 'product' as const
      }));

      const allItems = [...transformedImages, ...transformedProducts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setMediaItems(allItems);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load media",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (filePath: string) => {
    return `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${filePath}`;
  };

  const getFilteredItems = () => {
    if (filter === 'all') return mediaItems;
    if (filter === 'images') return mediaItems.filter(item => item.type === 'image');
    if (filter === 'products') return mediaItems.filter(item => item.type === 'product');
    if (filter === 'with captions') return mediaItems.filter(item => item.caption);
    if (filter === 'without captions') return mediaItems.filter(item => !item.caption);
    return mediaItems;
  };

  const filteredItems = getFilteredItems();
  const productItems = filteredItems.filter(item => item.type === 'product');
  const hasProducts = productItems.length > 0;

  const handleDeleteProducts = () => {
    if (selectedItems.size === 0) return;
    setDeleteAllMode(false);
    setShowDeleteDialog(true);
  };

  const handleDeleteAllProducts = () => {
    setDeleteAllMode(true);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    let success = false;
    
    if (deleteAllMode) {
      success = await deleteAllProducts();
    } else {
      success = await deleteSelectedProducts(filteredItems);
    }
    
    if (success) {
      await fetchMediaItems();
      setSelectionMode(false);
    }
    
    setShowDeleteDialog(false);
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    clearSelection();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibrant-purple"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-vibrant-purple" />
                {t('media.title')}
              </CardTitle>
              <CardDescription>
                {t('media.description')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!selectionMode ? (
                <>
                  <Button
                    onClick={() => navigate('/upload')}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t('media.addProducts')}
                  </Button>
                  <Button
                    onClick={() => navigate('/images')}
                    variant="outline"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Generate Captions
                  </Button>
                  {hasProducts && (
                    <Button
                      onClick={() => setSelectionMode(true)}
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Products
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={cancelSelection}
                    variant="outline"
                  >
                    {t('schedule.cancel')}
                  </Button>
                  <Button
                    onClick={() => selectAllItems(filteredItems)}
                    variant="outline"
                    disabled={selectedItems.size === productItems.length}
                  >
                    {t('media.selectAll')}
                  </Button>
                  <Button
                    onClick={handleDeleteAllProducts}
                    variant="destructive"
                    disabled={!hasProducts}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('media.deleteAll')}
                  </Button>
                  <Button
                    onClick={handleDeleteProducts}
                    variant="destructive"
                    disabled={selectedItems.size === 0}
                                    >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('media.deleteSelected', { count: selectedItems.size })}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Tag Filters */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-2">
                {getFilterTags().map((tag) => (
                  <Badge
                    key={tag.key}
                    variant={filter === tag.key ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setFilter(tag.key)}
                  >
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid/List */}
      <Card>
        <CardContent className="p-6">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-deep-blue dark:text-white mb-2">
                {filter === 'all' ? t('media.noMedia') : t('media.noFilter', { filter })}
              </h3>
              <p className="text-muted-foreground mb-4">
                Start by adding some products with images
              </p>
              <Button 
                onClick={() => navigate('/upload')}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Upload className="h-4 w-4 mr-2" />
                {t('media.addProducts')}
              </Button>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                : 'space-y-4'
            }>
              {filteredItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className={
                  viewMode === 'grid'
                    ? 'group relative aspect-square overflow-hidden rounded-lg border bg-muted'
                    : 'flex items-center gap-4 p-4 border rounded-lg'
                }>
                  {/* Selection checkbox for products */}
                  {selectionMode && item.type === 'product' && (
                    <div className={
                      viewMode === 'grid'
                        ? 'absolute top-2 left-2 z-10'
                        : 'flex-shrink-0'
                    }>
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                        className="bg-white/90 border-gray-300"
                      />
                    </div>
                  )}
                  
                  <img
                    src={getImageUrl(item.file_path)}
                    alt={item.name || item.original_filename || 'Media'}
                    className={
                      viewMode === 'grid'
                        ? 'h-full w-full object-cover transition-transform group-hover:scale-105'
                        : 'h-16 w-16 object-cover rounded-md'
                    }
                  />
                  {viewMode === 'grid' ? (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-center p-2">
                        <p className="text-sm font-medium truncate">
                          {item.name || item.original_filename}
                        </p>
                        <div className="flex gap-1 mt-1 justify-center">
                          <Badge variant="secondary" className="text-xs">
                            {item.type === 'product' ? 'Product' : 'Image'}
                          </Badge>
                          {item.caption && (
                            <Badge variant="secondary" className="text-xs">
                              Has Caption
                            </Badge>
                          )}
                          {item.type === 'product' && item.price && (
                            <Badge variant="secondary" className="text-xs">
                              ${item.price}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <h4 className="font-medium text-deep-blue dark:text-white">
                        {item.name || item.original_filename}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {item.type === 'product' ? 'Product' : 'Image'} • Uploaded {new Date(item.created_at).toLocaleDateString()}
                      </p>
                      {item.type === 'product' && item.price && (
                        <p className="text-sm font-medium text-green-600">${item.price}</p>
                      )}
                      <div className="flex gap-1 mt-1">
                        {item.caption && (
                          <Badge variant="secondary" className="text-xs">
                            Has Caption
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        isDeleting={deleting}
        selectedCount={deleteAllMode ? productItems.length : selectedItems.size}
        isDeleteAll={deleteAllMode}
      />
    </div>
  );
};

export default MediaManagement;

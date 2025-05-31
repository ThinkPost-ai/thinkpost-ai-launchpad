
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Grid3X3, 
  List, 
  Upload, 
  MessageSquare, 
  Filter,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Image {
  id: string;
  file_path: string;
  original_filename: string;
  caption?: string;
  created_at: string;
}

const MediaManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<string>('all');

  const tags = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Deals', 'Desserts'];

  useEffect(() => {
    fetchImages();
  }, [user]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load images",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (filePath: string) => {
    return `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${filePath}`;
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
                Media Management
              </CardTitle>
              <CardDescription>
                Manage your uploaded photos and videos
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/upload')}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Media
              </Button>
              <Button
                onClick={() => navigate('/images')}
                variant="outline"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Generate Captions
              </Button>
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
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={filter === tag.toLowerCase() ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setFilter(tag.toLowerCase())}
                  >
                    {tag}
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
          {images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-deep-blue dark:text-white mb-2">
                No media uploaded yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Start by uploading some photos of your delicious dishes
              </p>
              <Button 
                onClick={() => navigate('/upload')}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Image
              </Button>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                : 'space-y-4'
            }>
              {images.map((image) => (
                <div key={image.id} className={
                  viewMode === 'grid'
                    ? 'group relative aspect-square overflow-hidden rounded-lg border bg-muted'
                    : 'flex items-center gap-4 p-4 border rounded-lg'
                }>
                  <img
                    src={getImageUrl(image.file_path)}
                    alt={image.original_filename}
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
                          {image.original_filename}
                        </p>
                        {image.caption && (
                          <Badge variant="secondary" className="mt-1">
                            Has Caption
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <h4 className="font-medium text-deep-blue dark:text-white">
                        {image.original_filename}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {new Date(image.created_at).toLocaleDateString()}
                      </p>
                      {image.caption && (
                        <Badge variant="secondary" className="mt-1">
                          Has Caption
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MediaManagement;

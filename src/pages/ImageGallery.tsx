
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, MessageSquare, Trash2, Wand2 } from 'lucide-react';

interface Image {
  id: string;
  file_path: string;
  original_filename: string;
  caption?: string;
  created_at: string;
}

const ImageGallery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [editingCaption, setEditingCaption] = useState('');
  const [generatingCaption, setGeneratingCaption] = useState(false);

  useEffect(() => {
    if (user) {
      fetchImages();
    }
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
    const { data } = supabase.storage
      .from('restaurant-images')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const deleteImage = async (imageId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('restaurant-images')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId);

      if (dbError) throw dbError;

      setImages(prev => prev.filter(img => img.id !== imageId));
      setSelectedImage(null);

      toast({
        title: "Success",
        description: "Image deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive"
      });
    }
  };

  const updateCaption = async (imageId: string, caption: string) => {
    try {
      const { error } = await supabase
        .from('images')
        .update({ caption })
        .eq('id', imageId);

      if (error) throw error;

      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, caption } : img
      ));

      setSelectedImage(prev => prev ? { ...prev, caption } : null);

      toast({
        title: "Success",
        description: "Caption updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update caption",
        variant: "destructive"
      });
    }
  };

  const generateCaption = async (imageId: string) => {
    setGeneratingCaption(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: { imageId }
      });

      if (error) throw error;

      const newCaption = data.caption;
      setEditingCaption(newCaption);
      
      toast({
        title: "Success",
        description: "AI caption generated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate caption",
        variant: "destructive"
      });
    } finally {
      setGeneratingCaption(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-vibrant-purple" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-deep-blue dark:text-white mb-2">
                Image Gallery
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your uploaded images and generate AI captions
              </p>
            </div>
            <Button
              onClick={() => navigate('/upload')}
              className="bg-gradient-primary hover:opacity-90"
            >
              Upload More Images
            </Button>
          </div>
        </div>

        {images.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-deep-blue dark:text-white mb-2">
                No images uploaded yet
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Start by uploading some photos of your delicious dishes
              </p>
              <Button
                onClick={() => navigate('/upload')}
                className="bg-gradient-primary hover:opacity-90"
              >
                Upload Your First Image
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage?.id === image.id
                        ? 'border-vibrant-purple shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedImage(image);
                      setEditingCaption(image.caption || '');
                    }}
                  >
                    <img
                      src={getImageUrl(image.file_path)}
                      alt={image.original_filename}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all" />
                    {image.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <p className="text-white text-sm truncate">
                          {image.caption}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedImage && (
              <div className="lg:col-span-1">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Caption Editor
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteImage(selectedImage.id, selectedImage.file_path)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Edit or generate AI captions for your image
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <img
                      src={getImageUrl(selectedImage.file_path)}
                      alt={selectedImage.original_filename}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Caption</label>
                      <Textarea
                        value={editingCaption}
                        onChange={(e) => setEditingCaption(e.target.value)}
                        placeholder="Enter a caption for this image..."
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => generateCaption(selectedImage.id)}
                        disabled={generatingCaption}
                        variant="outline"
                        className="flex-1"
                      >
                        {generatingCaption ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            AI Generate
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => updateCaption(selectedImage.id, editingCaption)}
                        className="flex-1 bg-gradient-primary hover:opacity-90"
                      >
                        Save Caption
                      </Button>
                    </div>

                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>Filename: {selectedImage.original_filename}</p>
                      <p>Uploaded: {new Date(selectedImage.created_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;


import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, ArrowLeft } from 'lucide-react';

const ImageUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (!user || selectedFiles.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('restaurant-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Insert record into database
        const { error: dbError } = await supabase
          .from('images')
          .insert({
            user_id: user.id,
            file_path: uploadData.path,
            original_filename: file.name
          });

        if (dbError) throw dbError;

        return uploadData.path;
      });

      await Promise.all(uploadPromises);

      toast({
        title: "Success!",
        description: `${selectedFiles.length} image(s) uploaded successfully`
      });

      navigate('/images');
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload images",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/user-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-deep-blue dark:text-white mb-2">
            Upload Images
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload photos of your delicious dishes to generate AI-powered captions
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Images</CardTitle>
            <CardDescription>
              Choose multiple images to upload. Supported formats: JPG, PNG, WEBP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-lg font-medium text-deep-blue dark:text-white">
                  Click to upload images
                </span>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  or drag and drop your files here
                </p>
              </Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-deep-blue dark:text-white">
                  Selected Images ({selectedFiles.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                        {file.name}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={uploadImages}
                    disabled={uploading}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      `Upload ${selectedFiles.length} Image(s)`
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFiles([])}
                    disabled={uploading}
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageUpload;

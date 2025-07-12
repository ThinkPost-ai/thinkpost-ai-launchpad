
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, ArrowLeft, ImageIcon, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { processImagesForTikTok, getProcessingSummary } from '@/utils/imageProcessing';

const ImageUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Show processing indicator
      setProcessing(true);
      
      try {
        // Process images for TikTok compatibility
        const processedResults = await processImagesForTikTok(files);
        const processedFiles = processedResults.map(result => result.file);
        
        setSelectedFiles(prev => [...prev, ...processedFiles]);
        
        // Show processing summary
        const summary = getProcessingSummary(processedResults);
        toast({
          title: t('upload.imagesProcessed'),
          description: `${summary} - Ready for TikTok posting!`,
          duration: 4000,
        });
      } catch (error) {
        console.error('Error processing images:', error);
        toast({
          title: t('upload.processingError'),
          description: t('upload.processingErrorDescription'),
          variant: "destructive"
        });
      } finally {
        setProcessing(false);
      }
    }
  }, [toast, t]);

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
        title: t('upload.uploadSuccess'),
        description: t('upload.tiktokOptimizedSuccess')
      });

      navigate('/images');
    } catch (error: any) {
      toast({
        title: t('upload.uploadFailed'),
        description: error.message || t('upload.uploadFailedDescription'),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className={`mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          <Button
            variant="ghost"
            onClick={() => navigate('/user-dashboard')}
            className={`mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2 mr-0 rotate-180' : 'mr-2'}`} />
            {t('upload.backToDashboard')}
          </Button>
          <h1 className="text-3xl font-bold text-deep-blue dark:text-white mb-2">
            {t('upload.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('upload.description')}
          </p>
          
          {/* TikTok Optimization Notice */}
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{t('upload.tiktokOptimizationEnabled')}</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {t('upload.tiktokOptimizationDescription')}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className={isRTL ? 'text-right' : 'text-left'}>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {t('upload.selectImages')}
            </CardTitle>
            <CardDescription>
              {t('upload.selectImagesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-lg font-medium text-deep-blue dark:text-white">
                  {processing ? t('upload.processingImages') : t('upload.clickToUpload')}
                </span>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  {processing ? t('upload.optimizingForTikTok') : t('upload.dragAndDrop')}
                </p>
              </Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={processing}
              />
              {processing && (
                <div className="mt-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-vibrant-purple" />
                </div>
              )}
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-4">
                <h3 className={`text-lg font-semibold text-deep-blue dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('upload.selectedImages')} ({selectedFiles.length})
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
                        className={`absolute top-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isRTL ? 'left-2' : 'right-2'
                        }`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <p className={`text-sm text-gray-600 dark:text-gray-400 mt-1 truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                        {file.name}
                      </p>
                    </div>
                  ))}
                </div>

                <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Button
                    onClick={uploadImages}
                    disabled={uploading || processing}
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('upload.uploading')}
                      </>
                    ) : (
                      <>
                        <CheckCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('upload.uploadButton', { count: selectedFiles.length })}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFiles([])}
                    disabled={uploading || processing}
                  >
                    {t('upload.clearAll')}
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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Upload, X, Image as ImageIcon, Video, Loader2, Instagram, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTikTokConnection } from '@/hooks/useTikTokConnection';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TikTokIcon from '@/components/ui/TikTokIcon';
import { processImageForTikTok } from '@/utils/imageProcessing';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GeneralContentItem {
  id: string;
  file: File | null;
  filePreview: string | null;
  contentType: string;
  description: string;
  tiktokEnabled: boolean;
  instagramEnabled: boolean;
}

const GeneralContentUpload = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const { tiktokProfile } = useTikTokConnection();
  const { profile: instagramProfile } = useInstagramConnection();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [items, setItems] = useState<GeneralContentItem[]>([{
    id: '1',
    file: null,
    filePreview: null,
    contentType: '',
    description: '',
    tiktokEnabled: false,
    instagramEnabled: false,
  }]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tiktokAdvancedExpanded, setTiktokAdvancedExpanded] = useState<Record<string, boolean>>({});

  const contentTypes = [
    { value: 'venue', label: t('generalContent.contentTypes.venue') },
    { value: 'busy', label: t('generalContent.contentTypes.busy') },
    { value: 'preparation', label: t('generalContent.contentTypes.preparation') },
    { value: 'atmosphere', label: t('generalContent.contentTypes.atmosphere') },
    { value: 'behindScenes', label: t('generalContent.contentTypes.behindScenes') },
    { value: 'customerMessages', label: t('generalContent.contentTypes.customerMessages') },
    { value: 'educational', label: t('generalContent.contentTypes.educational') },
    { value: 'events', label: t('generalContent.contentTypes.events') },
    { value: 'announcement', label: t('generalContent.contentTypes.announcement') },
    { value: 'random', label: t('generalContent.contentTypes.random') },
  ];

  const handleFileUpload = async (itemId: string, file: File) => {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: t('toast.error'),
        description: 'File size must be less than 50MB',
        variant: 'destructive',
      });
      return;
    }

    // Check if it's a video file - don't process videos, just use them directly
    const isVideo = file.type.startsWith('video/');
    
    if (isVideo) {
      // For videos, just create preview and use original file
      const filePreview = URL.createObjectURL(file);
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, file, filePreview }
          : item
      ));
    } else {
      // For images, process them for TikTok compatibility
      try {
        const processedResult = await processImageForTikTok(file);
        const processedFile = processedResult.file;
        const filePreview = URL.createObjectURL(processedFile);
        
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, file: processedFile, filePreview }
            : item
        ));

        // Show processing feedback if image was optimized
        if (processedResult.wasProcessed) {
          const descriptionKey = processedResult.originalSize.width > processedResult.processedSize.width 
            ? 'upload.imageOptimizedAndResized' 
            : 'upload.imageOptimizedDescription';
          
          toast({
            title: t('upload.imageOptimized'),
            description: t(descriptionKey),
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error processing image:', error);
        toast({
          title: t('upload.processingError'),
          description: "Could not process image. Using original file.",
          variant: "destructive"
        });
        
        // Fall back to original file if processing fails
        const filePreview = URL.createObjectURL(file);
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, file, filePreview }
            : item
        ));
      }
    }
  };

  const updateItem = (itemId: string, updates: Partial<GeneralContentItem>) => {
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, ...updates }
        : item
    ));
  };

  const addNewItem = () => {
    const newId = (items.length + 1).toString();
    setItems(prev => [...prev, {
      id: newId,
      file: null,
      filePreview: null,
      contentType: '',
      description: '',
      tiktokEnabled: false,
      instagramEnabled: false,
    }]);
  };

  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${user!.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('restaurant-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;
    return filePath;
  };

  const validateItems = (): boolean => {
    const isTikTokConnected = tiktokProfile?.tiktok_connected || false;
    const isInstagramConnected = instagramProfile?.connected || false;

    for (const item of items) {
      if (!item.file) {
        toast({
          title: t('toast.error'),
          description: 'Please upload a file for all items',
          variant: 'destructive',
        });
        return false;
      }
      if (!item.contentType) {
        toast({
          title: t('toast.error'),
          description: 'Please select content type for all items',
          variant: 'destructive',
        });
        return false;
      }
      if (!item.tiktokEnabled && !item.instagramEnabled) {
        toast({
          title: t('toast.error'),
          description: 'Please enable at least one platform for all items',
          variant: 'destructive',
        });
        return false;
      }
      // Check if at least one enabled platform is actually connected
      const hasConnectedPlatform = (item.tiktokEnabled && isTikTokConnected) || 
                                  (item.instagramEnabled && isInstagramConnected);
      if (!hasConnectedPlatform) {
        toast({
          title: t('toast.socialMediaConnectionRequired'),
          description: t('toast.socialMediaConnectionRequiredDesc'),
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  // Silent validation for button state
  const isFormValid = (): boolean => {
    const isTikTokConnected = tiktokProfile?.tiktok_connected || false;
    const isInstagramConnected = instagramProfile?.connected || false;

    return items.every(item => {
      const hasFile = !!item.file;
      const hasContentType = !!item.contentType;
      const hasPlatformEnabled = item.tiktokEnabled || item.instagramEnabled;
      const hasConnectedPlatform = (item.tiktokEnabled && isTikTokConnected) || 
                                  (item.instagramEnabled && isInstagramConnected);
      
      return hasFile && hasContentType && hasPlatformEnabled && hasConnectedPlatform;
    });
  };

  const handleSaveOnly = async () => {
    if (!validateItems()) return;

    setSaving(true);
    try {
      for (const item of items) {
        if (!item.file) continue;

        // Upload file
        const filePath = await uploadFile(item.file);

        // Determine media type
        const isVideo = item.file.type.startsWith('video/');
        
        // Save to images table without caption
        const { error: imageError } = await supabase
          .from('images')
          .insert({
            user_id: user!.id,
            file_path: filePath,
            original_filename: item.file.name,
            caption: null, // No caption generation
            content_type: item.contentType,
            description: item.description || null,
            media_type: isVideo ? 'video' : 'photo',
            tiktok_enabled: item.tiktokEnabled,
            instagram_enabled: item.instagramEnabled,
          });

        if (imageError) throw imageError;
      }

      toast({
        title: t('toast.success'),
        description: `${items.length} ${t('generalContent.uploadSuccess')}`,
      });

      // Navigate to review page
      navigate('/review-content');

    } catch (error: any) {
      console.error('Error saving general content:', error);
      toast({
        title: t('toast.error'),
        description: 'Failed to save content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateItems()) return;

    setUploading(true);
    try {
      const uploadedItems = [];

      // First, upload all files and save to database
      for (const item of items) {
        if (!item.file) continue;

        // Upload file
        const filePath = await uploadFile(item.file);

        // Determine media type
        const isVideo = item.file.type.startsWith('video/');
        
        // Save to images table
        const { data: imageData, error: imageError } = await supabase
          .from('images')
          .insert({
            user_id: user!.id,
            file_path: filePath,
            original_filename: item.file.name,
            caption: null, // Will be generated next
            content_type: item.contentType,
            description: item.description || null,
            media_type: isVideo ? 'video' : 'photo',
            tiktok_enabled: item.tiktokEnabled,
            instagram_enabled: item.instagramEnabled,
          })
          .select()
          .single();

        if (imageError) throw imageError;
        uploadedItems.push(imageData);
      }

      // Generate captions for uploaded items
      if (uploadedItems.length > 0) {
        console.log('Starting caption generation for', uploadedItems.length, 'items');
        
        // Generate captions for each uploaded item
        const captionPromises = uploadedItems.map(async (imageData) => {
          try {
            console.log(`Generating caption for content: ${imageData.content_type}`, {
              imageId: imageData.id,
              contentType: imageData.content_type,
              description: imageData.description
            });

            const { data: captionData, error: captionError } = await supabase.functions.invoke('generate-caption', {
              body: {
                productName: null,
                price: null,
                description: imageData.description || '',
                contentType: 'general',
                contentCategory: imageData.content_type
              }
            });

            console.log(`Caption generation response for ${imageData.content_type}:`, {
              data: captionData,
              error: captionError
            });

            if (captionError) {
              console.error('Caption generation error:', captionError);
              
              // Show specific error message to user
              toast({
                title: t('toast.error'),
                description: captionError.message || `Failed to generate caption for ${imageData.original_filename}`,
                variant: "destructive"
              });

              if (captionError.message?.includes('Insufficient caption credits') || captionError.message?.includes('402')) {
                toast({
                  title: t('captions.noCredits'),
                  description: t('captions.noCreditsDescription'),
                  variant: "destructive"
                });
              }
              return imageData;
            }

            const caption = captionData?.caption;

            if (!caption) {
              console.error('No caption received for content:', imageData.original_filename);
              toast({
                title: t('toast.error'),
                description: `No caption generated for ${imageData.original_filename}`,
                variant: "destructive"
              });
              return imageData;
            }

            console.log(`Generated caption for ${imageData.original_filename}:`, caption);

            // Update the image with the generated caption
            const { error: updateError } = await supabase
              .from('images')
              .update({ caption })
              .eq('id', imageData.id);

            if (updateError) {
              console.error('Caption update error:', updateError);
              toast({
                title: t('toast.error'),
                description: `Failed to save caption for ${imageData.original_filename}`,
                variant: "destructive"
              });
            }

            return { ...imageData, caption };
          } catch (error) {
            console.error('Failed to generate caption for content:', imageData.original_filename, error);
            toast({
              title: t('toast.error'),
              description: `Error processing ${imageData.original_filename}: ${error.message}`,
              variant: "destructive"
            });
            return imageData;
          }
        });

        await Promise.all(captionPromises);

        toast({
          title: t('toast.success'),
          description: `${uploadedItems.length} ${t('generalContent.uploadSuccess')}`,
        });

        // Navigate to captions review page
        navigate('/review-content');
      }

    } catch (error: any) {
      console.error('Error uploading general content:', error);
      toast({
        title: t('toast.error'),
        description: 'Failed to upload content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const isTikTokConnected = tiktokProfile?.tiktok_connected || false;
  const isInstagramConnected = instagramProfile?.connected || false;
  const formIsValid = isFormValid();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/user-dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('generalContent.backToDashboard')}
          </Button>
          <h1 className="text-3xl font-bold text-deep-blue dark:text-white mb-2">
            {t('generalContent.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('generalContent.description')}
          </p>
        </div>

        {/* Content Items */}
        <div className="space-y-6">
          {items.map((item, index) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {t('generalContent.item', { number: index + 1 })}
                  </CardTitle>
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Section - Content Info */}
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div className="space-y-2">
                      <Label htmlFor={`file-${item.id}`}>{t('generalContent.mediaFile')} *</Label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                        {item.filePreview ? (
                          <div className="space-y-4">
                            <div className="flex justify-center">
                              {item.file?.type.startsWith('video/') ? (
                                <video
                                  src={item.filePreview}
                                  className="max-w-full h-32 object-cover rounded"
                                  controls
                                />
                              ) : (
                                <img
                                  src={item.filePreview}
                                  alt={t('generalContent.mediaPreview')}
                                  className="max-w-full h-32 object-cover rounded"
                                />
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*,video/*';
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) handleFileUpload(item.id, file);
                                };
                                input.click();
                              }}
                              className="w-full"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Change File
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="text-center cursor-pointer"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*,video/*';
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) handleFileUpload(item.id, file);
                              };
                              input.click();
                            }}
                          >
                            <div className="space-y-2">
                              <div className="flex justify-center">
                                <ImageIcon className="h-8 w-8 text-gray-400 mr-2" />
                                <Video className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('generalContent.clickToUpload')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content Type Selection */}
                    <div className="space-y-2">
                      <Label>{t('generalContent.contentType')} *</Label>
                      <Select
                        value={item.contentType}
                        onValueChange={(value) => updateItem(item.id, { contentType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('generalContent.selectContentType')} />
                        </SelectTrigger>
                        <SelectContent>
                          {contentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor={`description-${item.id}`}>
                        {t('generalContent.description.label')}
                      </Label>
                      <Textarea
                        id={`description-${item.id}`}
                        placeholder={t('generalContent.description.placeholder')}
                        value={item.description}
                        onChange={(e) => updateItem(item.id, { description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Right Section - Social Media Apps */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-deep-blue dark:text-white mb-4 flex items-center gap-2">
                        {t('upload.socialMediaApps')}
                      </h3>
                      
                      <div className="space-y-4">
                        {/* TikTok Toggle */}
                        <div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`flex items-center justify-between p-4 border rounded-lg ${isTikTokConnected ? 'bg-gray-50 dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900 opacity-60 cursor-not-allowed'}`}>
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isTikTokConnected ? 'bg-black' : 'bg-gray-400'}`}>
                                      <TikTokIcon className="h-6 w-6 text-white" size={24} />
                                    </div>
                                    <div>
                                      <Label className="text-base font-medium">TikTok</Label>
                                      <p className="text-sm text-muted-foreground">
                                        {isTikTokConnected ? t('upload.postToTikTok') : t('upload.connectTikTokFirst')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {item.tiktokEnabled && isTikTokConnected && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setTiktokAdvancedExpanded(prev => ({
                                            ...prev,
                                            [item.id]: !prev[item.id]
                                          }));
                                        }}
                                        className="p-1 h-8 w-8"
                                      >
                                        {tiktokAdvancedExpanded[item.id] ? (
                                          <ChevronUp className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}
                                    <Switch
                                      checked={item.tiktokEnabled && isTikTokConnected}
                                      onCheckedChange={(checked) => {
                                        if (isTikTokConnected) {
                                          updateItem(item.id, { tiktokEnabled: checked });
                                        }
                                      }}
                                      disabled={!isTikTokConnected}
                                    />
                                  </div>
                                </div>
                              </TooltipTrigger>
                              {!isTikTokConnected && (
                                <TooltipContent>
                                  <p>{t('upload.connectAccountTooltip', { platform: 'TikTok' })}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>

                          {/* TikTok Advanced Settings - shown when expanded */}
                          {item.tiktokEnabled && isTikTokConnected && tiktokAdvancedExpanded[item.id] && (
                            <div className="mt-2 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                              <div className="mb-4">
                                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                  <TikTokIcon className="h-4 w-4" size={16} />
                                  {t('upload.advancedSettings')}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Advanced TikTok settings will be available in future updates for general content.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Instagram Toggle */}
                        <div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`flex items-center justify-between p-4 border rounded-lg ${isInstagramConnected ? 'bg-gray-50 dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-900 opacity-60 cursor-not-allowed'}`}>
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isInstagramConnected ? 'bg-gradient-to-br from-purple-600 to-pink-500' : 'bg-gray-400'}`}>
                                      <Instagram className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                      <Label className="text-base font-medium">Instagram</Label>
                                      <p className="text-sm text-muted-foreground">
                                        {isInstagramConnected ? t('upload.postToInstagram') : t('upload.connectInstagramFirst')}
                                      </p>
                                    </div>
                                  </div>
                                  <Switch
                                    checked={item.instagramEnabled && isInstagramConnected}
                                    onCheckedChange={(checked) => {
                                      if (isInstagramConnected) {
                                        updateItem(item.id, { instagramEnabled: checked });
                                      }
                                    }}
                                    disabled={!isInstagramConnected}
                                  />
                                </div>
                              </TooltipTrigger>
                              {!isInstagramConnected && (
                                <TooltipContent>
                                  <p>{t('upload.connectAccountTooltip', { platform: 'Instagram' })}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Action Buttons */}
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              onClick={addNewItem}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('generalContent.addMore')}
            </Button>

            <div className="flex gap-4">
              <Button
                onClick={handleSaveOnly}
                disabled={saving || uploading || !formIsValid}
                variant="outline"
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('productActions.saving')}
                  </>
                ) : (
                  t('productActions.save')
                )}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading || saving || !formIsValid}
                className="bg-gradient-primary hover:opacity-90 flex-1"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('generalContent.uploading')}
                  </>
                ) : (
                  t('generalContent.uploadAndGenerate')
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralContentUpload; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Upload, X, Image as ImageIcon, Video } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTikTokConnection } from '@/hooks/useTikTokConnection';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

  const handleFileUpload = (itemId: string, file: File) => {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: t('toast.error'),
        description: 'File size must be less than 50MB',
        variant: 'destructive',
      });
      return;
    }

    const filePreview = URL.createObjectURL(file);
    setItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, file, filePreview }
        : item
    ));
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
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateItems()) return;

    setUploading(true);
    try {
      const uploadedItems = [];

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
            caption: null, // Will be generated later
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
        // Navigate to captions review page
        navigate('/review-content');
      }

      toast({
        title: t('toast.success'),
        description: `${uploadedItems.length} ${t('generalContent.uploadAndGenerate')}`,
      });

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/user-dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('generalContent.backToDashboard')}
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('generalContent.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('generalContent.description')}
          </p>
        </div>

        {/* Platform Connection Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t('upload.platformConnectionStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">TikTok</span>
                <span className={`text-sm ${isTikTokConnected ? 'text-green-600' : 'text-gray-500'}`}>
                  {isTikTokConnected 
                    ? t('upload.connectedAs', { username: tiktokProfile?.tiktok_username || '' })
                    : t('upload.notConnected')
                  }
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">Instagram</span>
                <span className={`text-sm ${isInstagramConnected ? 'text-green-600' : 'text-gray-500'}`}>
                  {isInstagramConnected 
                    ? t('upload.connectedAs', { username: instagramProfile?.instagram_username || '' })
                    : t('upload.notConnected')
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <CardContent className="space-y-4">
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
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                              <Upload className="h-6 w-6 text-gray-500" />
                            </div>
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

                {/* Platform Selection */}
                <div className="space-y-3">
                  <Label>{t('upload.socialMediaApps')}</Label>
                  <div className="space-y-3">
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Checkbox
                        id={`tiktok-${item.id}`}
                        checked={item.tiktokEnabled}
                        onCheckedChange={(checked) => updateItem(item.id, { tiktokEnabled: !!checked })}
                        disabled={!isTikTokConnected}
                      />
                      <Label
                        htmlFor={`tiktok-${item.id}`}
                        className={`flex-1 ${!isTikTokConnected ? 'text-gray-400' : ''}`}
                      >
                        {t('upload.postToTikTok')}
                        {!isTikTokConnected && (
                          <span className="text-sm text-gray-500 block">
                            {t('upload.connectTikTokFirst')}
                          </span>
                        )}
                      </Label>
                    </div>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Checkbox
                        id={`instagram-${item.id}`}
                        checked={item.instagramEnabled}
                        onCheckedChange={(checked) => updateItem(item.id, { instagramEnabled: !!checked })}
                        disabled={!isInstagramConnected}
                      />
                      <Label
                        htmlFor={`instagram-${item.id}`}
                        className={`flex-1 ${!isInstagramConnected ? 'text-gray-400' : ''}`}
                      >
                        {t('upload.postToInstagram')}
                        {!isInstagramConnected && (
                          <span className="text-sm text-gray-500 block">
                            {t('upload.connectInstagramFirst')}
                          </span>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Button
            variant="outline"
            onClick={addNewItem}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('generalContent.addMore')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploading}
            className="flex-1 bg-gradient-primary hover:opacity-90"
          >
            {uploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                {t('generalContent.uploading')}
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {t('generalContent.uploadAndGenerate')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GeneralContentUpload; 
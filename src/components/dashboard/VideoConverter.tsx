import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Video, 
  Upload, 
  Play, 
  Download, 
  Share2,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useImageToVideo } from '@/hooks/useImageToVideo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConvertedVideo {
  id: string;
  publicUrl: string;
  sessionId: string;
  createdAt: string;
}

const VideoConverter = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { 
    processImage, 
    convertImageOnly, 
    convertAndPublish, 
    isProcessing, 
    isConverting, 
    isPublishing 
  } = useImageToVideo();

  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [convertedVideo, setConvertedVideo] = useState<ConvertedVideo | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('restaurant-images')
      .upload(fileName, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const uploadedUrl = await uploadImageToStorage(file);
      
      // Create a temporary URL for preview
      const tempUrl = URL.createObjectURL(file);
      
      setImageUrl(uploadedUrl);
      setImageFile(file);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleConvertOnly = async () => {
    if (!imageUrl) {
      toast.error('Please select an image first');
      return;
    }

    const result = await convertImageOnly(imageUrl, caption);
    
    if (result.success && result.publicVideoUrl) {
      setConvertedVideo({
        id: result.videoId || '',
        publicUrl: result.publicVideoUrl,
        sessionId: result.sessionId || '',
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleConvertAndPublish = async () => {
    if (!imageUrl) {
      toast.error('Please select an image first');
      return;
    }

    if (!caption.trim()) {
      toast.error('Please enter a caption for TikTok posting');
      return;
    }

    const result = await convertAndPublish(imageUrl, caption);
    
    if (result.success && result.publicVideoUrl) {
      setConvertedVideo({
        id: result.videoId || '',
        publicUrl: result.publicVideoUrl,
        sessionId: result.sessionId || '',
        createdAt: new Date().toISOString()
      });
    }
  };

  const copyVideoUrl = () => {
    if (convertedVideo) {
      navigator.clipboard.writeText(convertedVideo.publicUrl);
      toast.success('Video URL copied to clipboard');
    }
  };

  const getProcessingStatus = () => {
    if (uploading) return { text: 'Uploading image...', progress: 10 };
    if (isConverting) return { text: 'Converting image to video...', progress: 50 };
    if (isPublishing) return { text: 'Publishing to TikTok...', progress: 80 };
    if (isProcessing) return { text: 'Processing...', progress: 30 };
    return { text: 'Ready', progress: 100 };
  };

  const status = getProcessingStatus();
  const isAnyProcessing = uploading || isProcessing || isConverting || isPublishing;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-vibrant-purple" />
            Image to TikTok Video Converter
          </CardTitle>
          <CardDescription>
            Convert your images into TikTok-ready videos and publish them directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="image-upload">Upload Image</Label>
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive ? 'border-vibrant-purple bg-purple-50' : 'border-gray-300'}
                ${imageUrl ? 'border-green-500 bg-green-50' : ''}
                ${uploading ? 'border-blue-500 bg-blue-50' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 text-blue-500 mx-auto animate-spin" />
                  <div>
                    <p className="text-lg font-medium">Uploading...</p>
                    <p className="text-sm text-muted-foreground">
                      Please wait while we upload your image
                    </p>
                  </div>
                </div>
              ) : imageUrl && imageFile ? (
                <div className="space-y-4">
                  <img 
                    src={URL.createObjectURL(imageFile)} 
                    alt="Selected" 
                    className="max-h-48 mx-auto rounded-lg shadow-md"
                  />
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span>Image ready for conversion</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium">Drop your image here</p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse files
                    </p>
                  </div>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Choose Image'}
              </Button>
            </div>
          </div>

          {/* Caption Input */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (Optional for conversion, Required for TikTok)</Label>
            <Textarea
              id="caption"
              placeholder="Enter your TikTok caption here..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={isAnyProcessing}
            />
            <p className="text-xs text-muted-foreground">
              {caption.length}/2200 characters
            </p>
          </div>

          {/* Processing Status */}
          {isAnyProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{status.text}</span>
              </div>
              <Progress value={status.progress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleConvertOnly}
              disabled={!imageUrl || isAnyProcessing}
              variant="outline"
              className="flex-1"
            >
              {isConverting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Video className="h-4 w-4 mr-2" />
              )}
              Convert to Video Only
            </Button>
            <Button
              onClick={handleConvertAndPublish}
              disabled={!imageUrl || !caption.trim() || isAnyProcessing}
              className="flex-1 bg-gradient-primary hover:opacity-90"
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4 mr-2" />
              )}
              Convert & Publish to TikTok
            </Button>
          </div>

          {/* Converted Video Result */}
          {convertedVideo && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Video converted successfully!
                  </span>
                </div>
                
                <div className="space-y-4">
                  <video
                    src={convertedVideo.publicUrl}
                    controls
                    className="w-full max-w-sm mx-auto rounded-lg shadow-md"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                  
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={copyVideoUrl}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Copy URL
                    </Button>
                    <Button
                      onClick={() => window.open(convertedVideo.publicUrl, '_blank')}
                      variant="outline"
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Open Video
                    </Button>
                  </div>

                  <div className="text-center">
                    <Badge variant="secondary" className="text-xs">
                      Session ID: {convertedVideo.sessionId}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Upload any image (JPG, PNG, GIF supported)</p>
          <p>• Images are converted to 4-second MP4 videos optimized for TikTok</p>
          <p>• Videos are accessible via public URLs under your domain</p>
          <p>• Use "Convert Only" to get the video file for manual posting</p>
          <p>• Use "Convert & Publish" to automatically post to your connected TikTok account</p>
          <p>• Make sure your TikTok account is connected in the Overview tab</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoConverter; 
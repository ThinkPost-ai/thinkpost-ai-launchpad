import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  MessageSquare, 
  Edit, 
  Play, 
  TrendingUp,
  Eye,
  Heart,
  Wand2,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CaptionData {
  id: string;
  image_path: string;
  original_filename: string;
  caption?: string;
  created_at: string;
  status: 'draft' | 'scheduled' | 'posted';
  social_stats?: {
    instagram_views?: number;
    instagram_likes?: number;
    tiktok_views?: number;
    tiktok_likes?: number;
  };
}

const GeneratedCaptions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [captions, setCaptions] = useState<CaptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCaption, setGeneratingCaption] = useState<string | null>(null);
  const [mealNames, setMealNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    fetchCaptions();
  }, [user]);

  const fetchCaptions = async () => {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user?.id)
        .not('caption', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data and add mock social stats for demo
      const transformedData = (data || []).map(image => {
        // Generate random status with proper typing
        const randomValue = Math.random();
        let status: 'draft' | 'scheduled' | 'posted';
        if (randomValue > 0.7) {
          status = 'posted';
        } else if (randomValue > 0.5) {
          status = 'scheduled';
        } else {
          status = 'draft';
        }

        return {
          id: image.id,
          image_path: image.file_path,
          original_filename: image.original_filename,
          caption: image.caption,
          created_at: image.created_at,
          status,
          social_stats: {
            instagram_views: Math.floor(Math.random() * 1000) + 100,
            instagram_likes: Math.floor(Math.random() * 100) + 10,
            tiktok_views: Math.floor(Math.random() * 5000) + 500,
            tiktok_likes: Math.floor(Math.random() * 500) + 50,
          }
        };
      });

      setCaptions(transformedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load captions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (filePath: string) => {
    return `https://eztbwukcnddtvcairvpz.supabase.co/storage/v1/object/public/restaurant-images/${filePath}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      scheduled: 'default',
      posted: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const regenerateCaption = async (imageId: string) => {
    setGeneratingCaption(imageId);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: { 
          imageId,
          mealName: mealNames[imageId] || 'وجبة مميزة'
        }
      });

      if (error) throw error;

      const newCaption = data.caption;
      
      // Update the local state
      setCaptions(prev => prev.map(caption => 
        caption.id === imageId ? { ...caption, caption: newCaption } : caption
      ));
      
      toast({
        title: "نجح!",
        description: "تم إنشاء المحتوى بنجاح"
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء المحتوى",
        variant: "destructive"
      });
    } finally {
      setGeneratingCaption(null);
    }
  };

  const updateMealName = (imageId: string, mealName: string) => {
    setMealNames(prev => ({
      ...prev,
      [imageId]: mealName
    }));
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-vibrant-purple" />
                Generated Captions
              </CardTitle>
              <CardDescription>
                Manage your AI-generated captions and social media performance
              </CardDescription>
            </div>
            <Button 
              onClick={() => window.location.href = '/images'}
              className="bg-gradient-primary hover:opacity-90"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Generate New Caption
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {captions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-deep-blue dark:text-white mb-2">
                No captions generated yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Upload some images and generate AI captions to get started
              </p>
              <Button 
                onClick={() => window.location.href = '/images'}
                className="bg-gradient-primary hover:opacity-90"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Generate Your First Caption
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Caption (Arabic)</TableHead>
                    <TableHead>Meal Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Social Media Performance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {captions.map((caption) => (
                    <TableRow key={caption.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(caption.image_path)}
                            alt={caption.original_filename}
                            className="h-12 w-12 object-cover rounded-md"
                          />
                          <div>
                            <p className="text-sm font-medium text-deep-blue dark:text-white">
                              {caption.original_filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(caption.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-right line-clamp-3" dir="rtl">
                          {caption.caption || 'No caption generated'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={mealNames[caption.id] || ''}
                          onChange={(e) => updateMealName(caption.id, e.target.value)}
                          placeholder="اسم الوجبة"
                          className="w-32 text-right"
                          dir="rtl"
                        />
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(caption.status)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-pink-500">IG:</span>
                            <Eye className="h-3 w-3" />
                            <span>{caption.social_stats?.instagram_views}</span>
                            <Heart className="h-3 w-3" />
                            <span>{caption.social_stats?.instagram_likes}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-black">TT:</span>
                            <Eye className="h-3 w-3" />
                            <span>{caption.social_stats?.tiktok_views}</span>
                            <Heart className="h-3 w-3" />
                            <span>{caption.social_stats?.tiktok_likes}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => regenerateCaption(caption.id)}
                            disabled={generatingCaption === caption.id}
                          >
                            {generatingCaption === caption.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Wand2 className="h-3 w-3" />
                            )}
                          </Button>
                          {caption.status === 'draft' && (
                            <Button size="sm" className="bg-gradient-primary hover:opacity-90">
                              <Play className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneratedCaptions;

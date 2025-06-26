import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
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
  Loader2,
  X,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CaptionData {
  id: string;
  image_path: string;
  original_filename?: string;
  name?: string;
  price?: number;
  description?: string;
  caption?: string;
  created_at: string;
  status: 'draft' | 'scheduled' | 'posted';
  type: 'image' | 'product';
  social_stats?: {
    instagram_views?: number;
    instagram_likes?: number;
    tiktok_views?: number;
    tiktok_likes?: number;
  };
}

interface GeneratedCaptionsProps {
  onCreditsUpdate?: () => void;
}

const GeneratedCaptions = ({ onCreditsUpdate }: GeneratedCaptionsProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [captions, setCaptions] = useState<CaptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCaption, setGeneratingCaption] = useState<string | null>(null);
  const [mealNames, setMealNames] = useState<{[key: string]: string}>({});
  const [userCredits, setUserCredits] = useState<number>(0);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    fetchCaptions();
    fetchUserCredits();
  }, [user]);

  const fetchUserCredits = async () => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('caption_credits')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching user credits:', error);
        return;
      }

      setUserCredits(profileData?.caption_credits || 0);
    } catch (error) {
      console.error('Failed to fetch user credits:', error);
    }
  };

  const fetchCaptions = async () => {
    try {
      const { data: images, error: imagesError } = await supabase
        .from('images')
        .select('*')
        .eq('user_id', user?.id)
        .not('caption', 'is', null)
        .order('created_at', { ascending: false });

      if (imagesError) throw imagesError;

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch scheduled posts to determine real status
      const { data: scheduledPosts, error: postsError } = await supabase
        .from('scheduled_posts')
        .select('product_id, status, scheduled_date')
        .eq('user_id', user?.id);

      if (postsError) {
        console.error('Error fetching scheduled posts:', postsError);
      }

      // Create a map of product/image IDs to their scheduled post status
      const statusMap = new Map();
      if (scheduledPosts) {
        scheduledPosts.forEach(post => {
          if (post.product_id) {
            statusMap.set(post.product_id, {
              status: post.status,
              scheduled_date: post.scheduled_date
            });
          }
        });
      }

      const transformedImages = (images || []).map(image => {
        // For images, default to draft since they're not typically scheduled automatically
        const status = 'draft';

        return {
          id: image.id,
          image_path: image.file_path,
          original_filename: image.original_filename,
          caption: image.caption,
          created_at: image.created_at,
          status,
          type: 'image' as const,
          social_stats: {
            instagram_views: Math.floor(Math.random() * 1000) + 100,
            instagram_likes: Math.floor(Math.random() * 100) + 10,
            tiktok_views: Math.floor(Math.random() * 5000) + 500,
            tiktok_likes: Math.floor(Math.random() * 500) + 50,
          }
        };
      });

      const transformedProducts = (products || []).map(product => {
        // Determine real status based on scheduled posts
        let status: 'draft' | 'scheduled' | 'posted' = 'draft';
        
        const postInfo = statusMap.get(product.id);
        if (postInfo) {
          if (postInfo.status === 'posted') {
            status = 'posted';
          } else if (postInfo.status === 'scheduled' && postInfo.scheduled_date) {
            const scheduledDate = new Date(postInfo.scheduled_date);
            const now = new Date();
            if (scheduledDate > now) {
              status = 'scheduled';
            } else {
              status = 'posted'; // Past scheduled date means it should be posted
            }
          }
        } else if (product.caption) {
          // If product has caption but no scheduled post, it's a draft
          status = 'draft';
        }

        return {
          id: product.id,
          image_path: product.image_path,
          name: product.name,
          price: product.price,
          description: product.description,
          caption: product.caption,
          created_at: product.created_at,
          status,
          type: 'product' as const,
          social_stats: {
            instagram_views: Math.floor(Math.random() * 1000) + 100,
            instagram_likes: Math.floor(Math.random() * 100) + 10,
            tiktok_views: Math.floor(Math.random() * 5000) + 500,
            tiktok_likes: Math.floor(Math.random() * 500) + 50,
          }
        };
      });

      const allCaptions = [...transformedImages, ...transformedProducts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setCaptions(allCaptions);
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

  const regenerateCaption = async (itemId: string, itemType: 'image' | 'product') => {
    // Check credits before attempting to generate
    if (userCredits <= 0) {
      toast({
        title: "No Remaining Credits",
        description: "You have 0 caption credits remaining. You've reached your monthly limit.",
        variant: "destructive"
      });
      return;
    }

    console.log('Starting regenerateCaption for:', { itemId, itemType, userCredits });

    setGeneratingCaption(itemId);
    
    try {
      let requestBody;
      if (itemType === 'product') {
        const product = captions.find(c => c.id === itemId && c.type === 'product');
        console.log('Found product:', product);
        requestBody = {
          productName: product?.name || 'وجبة مميزة',
          price: product?.price,
          description: product?.description
        };
      } else {
        requestBody = { 
          imageId: itemId,
          mealName: mealNames[itemId] || 'وجبة مميزة'
        };
      }

      console.log('Sending request to generate-caption with body:', requestBody);

      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: requestBody
      });

      console.log('Response from generate-caption:', { data, error });

      if (error) {
        console.error('Error from generate-caption function:', error);
        if (error.message?.includes('Insufficient caption credits') || error.message?.includes('402')) {
          toast({
            title: "No Remaining Credits",
            description: "You have 0 caption credits remaining. You've reached your monthly limit.",
            variant: "destructive"
          });
          // Update local credits state
          setUserCredits(0);
          // Trigger credits update in parent component
          onCreditsUpdate?.();
          return;
        }
        throw error;
      }

      const newCaption = data.caption;
      console.log('Generated caption:', newCaption);
      
      // Update the database
      const table = itemType === 'product' ? 'products' : 'images';
      console.log('Updating table:', table, 'with caption for ID:', itemId);
      
      const { error: updateError } = await supabase
        .from(table)
        .update({ caption: newCaption })
        .eq('id', itemId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }
      
      // Update the local state
      setCaptions(prev => prev.map(caption => 
        caption.id === itemId ? { ...caption, caption: newCaption } : caption
      ));
      
      // Update credits count
      setUserCredits(prev => Math.max(0, prev - 1));
      
      // Trigger credits update in parent component
      onCreditsUpdate?.();
      
      console.log('Caption regeneration completed successfully');
      
      toast({
        title: "Success!",
        description: "Caption generated successfully"
      });
    } catch (error: any) {
      console.error('Caption regeneration error:', error);
      toast({
        title: "Error",
        description: "Failed to generate caption",
        variant: "destructive"
      });
    } finally {
      setGeneratingCaption(null);
    }
  };

  const updateMealName = (itemId: string, mealName: string) => {
    setMealNames(prev => ({
      ...prev,
      [itemId]: mealName
    }));
  };

  const startEditing = (caption: CaptionData) => {
    setEditingCaption(caption.caption || '');
    setEditingItemId(caption.id);
  };

  const cancelEditing = () => {
    setEditingCaption(null);
    setEditingItemId(null);
  };

  const saveCaption = async (itemId: string, itemType: 'image' | 'product', newCaption: string) => {
    try {
      const table = itemType === 'product' ? 'products' : 'images';
      const { error: updateError } = await supabase
        .from(table)
        .update({ caption: newCaption })
        .eq('id', itemId);

      if (updateError) throw updateError;

      setCaptions(prev => prev.map(caption =>
        caption.id === itemId ? { ...caption, caption: newCaption } : caption
      ));

      toast({
        title: "Success",
        description: "Caption updated successfully"
      });

      cancelEditing();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update caption",
        variant: "destructive"
      });
    }
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
                {t('captions.title')}
              </CardTitle>
              <CardDescription>
                {t('captions.description')}
              </CardDescription>
            </div>
            <Button 
              onClick={() => window.location.href = '/upload'}
              className="bg-gradient-primary hover:opacity-90"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('captions.addMore')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {captions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-deep-blue dark:text-white mb-2">
                {t('captions.noContent')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('captions.addProducts')}
              </p>
              <Button 
                onClick={() => window.location.href = '/upload'}
                className="bg-gradient-primary hover:opacity-90"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('captions.addFirst')}
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.content')}</TableHead>
                    <TableHead>{t('table.caption')}</TableHead>
                    <TableHead>{t('table.details')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead>{t('table.performance')}</TableHead>
                    <TableHead>{t('table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {captions.map((caption) => (
                    <TableRow key={`${caption.type}-${caption.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(caption.image_path)}
                            alt={caption.name || caption.original_filename || 'Content'}
                            className="h-12 w-12 object-cover rounded-md"
                          />
                          <div>
                            <p className="text-sm font-medium text-deep-blue dark:text-white">
                              {caption.name || caption.original_filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {caption.type === 'product' ? 'Product' : 'Image'} • {new Date(caption.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {editingItemId === caption.id ? (
                          <div className="flex flex-col gap-2">
                            <Textarea
                              value={editingCaption}
                              onChange={(e) => setEditingCaption(e.target.value)}
                              className="text-right min-h-[100px]"
                              dir="rtl"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => saveCaption(caption.id, caption.type, editingCaption || '')}
                                className="bg-gradient-primary hover:opacity-90"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-right line-clamp-3" dir="rtl">
                            {caption.caption || (
                              <span className="text-muted-foreground italic">
                                No caption generated yet
                              </span>
                            )}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        {caption.type === 'product' ? (
                          <div className="space-y-1">
                            {caption.price && (
                              <p className="text-sm font-medium">${caption.price}</p>
                            )}
                            {caption.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {caption.description}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Input
                            value={mealNames[caption.id] || ''}
                            onChange={(e) => updateMealName(caption.id, e.target.value)}
                            placeholder="اسم الوجبة"
                            className="w-32 text-right"
                            dir="rtl"
                          />
                        )}
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
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => startEditing(caption)}
                            disabled={editingItemId !== null}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => regenerateCaption(caption.id, caption.type)}
                            disabled={generatingCaption === caption.id || userCredits <= 0}
                            title={userCredits <= 0 ? "No caption credits remaining" : "Regenerate caption"}
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

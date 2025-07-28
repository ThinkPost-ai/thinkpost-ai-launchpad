
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCaptionData } from './captions/useCaptionData';
import { GeneratedCaptionsProps } from './captions/types';
import EmptyCaptionsState from './captions/EmptyCaptionsState';
import MobileGeneratedCaptions from './MobileGeneratedCaptions';
import { useIsMobile } from '@/hooks/use-mobile';
import CaptionGridCard from './captions/CaptionGridCard';

const GeneratedCaptions = ({ onCreditsUpdate }: GeneratedCaptionsProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { 
    captions, 
    setCaptions, 
    loading, 
    userCredits, 
    setUserCredits 
  } = useCaptionData();
  
  const [generatingCaption, setGeneratingCaption] = useState<string | null>(null);

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
          description: product?.description,
          contentType: 'product',
          contentCategory: null
        };
      } else {
        const image = captions.find(c => c.id === itemId && c.type === 'image');
        console.log('Found image:', image);
        requestBody = { 
          productName: null,
          price: null,
          description: image?.description || '',
          contentType: image?.content_type ? 'general' : 'product', // If content_type exists, it's general content
          contentCategory: image?.content_type || null
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

  const handleCaptionUpdate = (id: string, newCaption: string) => {
    setCaptions(prev => prev.map(caption =>
      caption.id === id ? { ...caption, caption: newCaption } : caption
    ));
  };

  const handleCaptionDelete = (id: string, type: 'image' | 'product') => {
    setCaptions(prev => prev.filter(caption => caption.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vibrant-purple"></div>
      </div>
    );
  }

  // Use mobile layout for mobile devices
  if (isMobile) {
    return <MobileGeneratedCaptions onCreditsUpdate={onCreditsUpdate} />;
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
              onClick={() => window.location.href = '/schedule'}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {t('captions.schedule')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {captions.length === 0 ? (
            <EmptyCaptionsState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {captions.map((caption) => (
                <CaptionGridCard
                  key={`${caption.type}-${caption.id}`}
                  caption={caption}
                  onCaptionUpdate={handleCaptionUpdate}
                  onRegenerateCaption={regenerateCaption}
                  onDeleteCaption={handleCaptionDelete}
                  generatingCaption={generatingCaption}
                  userCredits={userCredits}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneratedCaptions;

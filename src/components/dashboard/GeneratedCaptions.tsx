
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MessageSquare, Loader2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCaptionData } from './captions/useCaptionData';
import { GeneratedCaptionsProps } from './captions/types';
import CaptionTableRow from './captions/CaptionTableRow';
import EmptyCaptionsState from './captions/EmptyCaptionsState';

const GeneratedCaptions = ({ onCreditsUpdate }: GeneratedCaptionsProps) => {
  const { toast } = useToast();
  const { t } = useLanguage();
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
          description: product?.description
        };
      } else {
        requestBody = { 
          imageId: itemId,
          mealName: 'وجبة مميزة'
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.content')}</TableHead>
                    <TableHead>{t('table.caption')}</TableHead>
                    <TableHead>{t('table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {captions.map((caption) => (
                    <CaptionTableRow
                      key={`${caption.type}-${caption.id}`}
                      caption={caption}
                      onCaptionUpdate={handleCaptionUpdate}
                      onRegenerateCaption={regenerateCaption}
                      generatingCaption={generatingCaption}
                      userCredits={userCredits}
                    />
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

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import EnhancementSelectionCard from './EnhancementSelectionCard';
import {
  Loader2,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

interface EnhancementReviewProps {
  onEnhancementComplete: () => void;
}

const EnhancementReview = ({ onEnhancementComplete }: EnhancementReviewProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingEnhancements, setPendingEnhancements] = useState([]);
  const [processingEnhancements, setProcessingEnhancements] = useState([]);
  const [completedEnhancements, setCompletedEnhancements] = useState([]);
  const [failedEnhancements, setFailedEnhancements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchEnhancementQueue();
    startPolling();

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  useEffect(() => {
    // Auto-start enhancement processing for pending items
    if (pendingEnhancements.length > 0) {
      startEnhancementProcessing();
    }
  }, [pendingEnhancements]);

  const fetchEnhancementQueue = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('enhancement_queue')
        .select(`
          *,
          products(name, image_path),
          images(original_filename, file_path)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Categorize enhancements by status
      const pending = data?.filter(e => e.status === 'pending') || [];
      const processing = data?.filter(e => e.status === 'processing') || [];
      const completed = data?.filter(e => e.status === 'completed') || [];
      const failed = data?.filter(e => e.status === 'failed') || [];

      setPendingEnhancements(pending);
      setProcessingEnhancements(processing);
      setCompletedEnhancements(completed);
      setFailedEnhancements(failed);
    } catch (error: any) {
      console.error('Failed to fetch enhancement queue:', error);
      toast({
        title: "Error",
        description: "Failed to load enhancement status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    const interval = setInterval(() => {
      fetchEnhancementQueue();
    }, 3000); // Poll every 3 seconds

    setPollingInterval(interval);
  };

  const startEnhancementProcessing = async () => {
    for (const enhancement of pendingEnhancements) {
      await processEnhancement(enhancement);
    }
  };

  const processEnhancement = async (enhancement: any) => {
    try {
      // Update status to processing
      await supabase
        .from('enhancement_queue')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', enhancement.id);

      // Call enhancement function
      const { data, error } = await supabase.functions.invoke('enhance-image', {
        body: {
          enhancementId: enhancement.id,
          contentType: enhancement.content_type,
          contentId: enhancement.content_id,
          imageUrl: enhancement.original_image_url,
          productName: enhancement.products?.name || enhancement.images?.original_filename
        }
      });

      if (error) {
        console.error('Enhancement failed:', error);
        await supabase
          .from('enhancement_queue')
          .update({ 
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', enhancement.id);
      }
    } catch (error: any) {
      console.error('Failed to process enhancement:', error);
      await supabase
        .from('enhancement_queue')
        .update({ 
          status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', enhancement.id);
    }
  };

  const handleRegenerate = async (enhancementId: string) => {
    try {
      // Update enhancement queue to mark for regeneration
      const { error } = await supabase
        .from('enhancement_queue')
        .update({ 
          status: 'pending',
          regeneration_count: supabase.raw('regeneration_count + 1'),
          regeneration_reason: 'User requested regeneration',
          updated_at: new Date().toISOString()
        })
        .eq('id', enhancementId);

      if (error) throw error;

      // Move from completed back to pending for reprocessing
      const enhancement = completedEnhancements.find(e => e.id === enhancementId);
      if (enhancement) {
        setCompletedEnhancements(prev => prev.filter(e => e.id !== enhancementId));
        setPendingEnhancements(prev => [...prev, { ...enhancement, status: 'pending' }]);
        
        // Start processing the regeneration
        await processEnhancement({ ...enhancement, status: 'pending' });
      }

    } catch (error: any) {
      console.error('Failed to regenerate enhancement:', error);
      throw error;
    }
  };

  const handleSelectionChange = (enhancementId: string, selection: 'original' | 'enhanced') => {
    console.log(`Selection updated for ${enhancementId}: ${selection}`);
    // The selection is already saved to database in the component
  };

  const handleRetryFailed = async (enhancement: any) => {
    try {
      await supabase
        .from('enhancement_queue')
        .update({ 
          status: 'pending',
          error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', enhancement.id);

      // Move from failed to pending
      setFailedEnhancements(prev => prev.filter(e => e.id !== enhancement.id));
      setPendingEnhancements(prev => [...prev, { ...enhancement, status: 'pending' }]);

      await processEnhancement({ ...enhancement, status: 'pending' });

      toast({
        title: "Retrying Enhancement",
        description: "Enhancement process has been restarted"
      });
    } catch (error: any) {
      toast({
        title: "Retry Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getTotalProgress = () => {
    const total = pendingEnhancements.length + processingEnhancements.length + completedEnhancements.length + failedEnhancements.length;
    const completed = completedEnhancements.length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center space-y-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading enhancement status...</span>
        </div>
      </Card>
    );
  }

  const totalEnhancements = pendingEnhancements.length + processingEnhancements.length + completedEnhancements.length + failedEnhancements.length;

  if (totalEnhancements === 0) {
    return null; // No enhancements to show
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-yellow-500" />
          Review Enhanced Images
        </h2>
        <Badge variant="outline">
          {completedEnhancements.length} of {totalEnhancements} completed
        </Badge>
      </div>

      {/* Overall Progress */}
      {(pendingEnhancements.length > 0 || processingEnhancements.length > 0) && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Enhancement Progress</span>
              <span>{Math.round(getTotalProgress())}%</span>
            </div>
            <Progress value={getTotalProgress()} className="w-full" />
          </div>
        </Card>
      )}

      {/* Pending Enhancements */}
      {pendingEnhancements.map(enhancement => (
        <Card key={enhancement.id} className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div className="flex-1">
              <h4 className="font-medium">
                {enhancement.products?.name || enhancement.images?.original_filename}
              </h4>
              <p className="text-sm text-muted-foreground">Queued for enhancement</p>
            </div>
            <Badge variant="secondary">Pending</Badge>
          </div>
        </Card>
      ))}

      {/* Processing Enhancements */}
      {processingEnhancements.map(enhancement => (
        <Card key={enhancement.id} className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <div className="flex-1">
              <h4 className="font-medium">
                {enhancement.products?.name || enhancement.images?.original_filename}
              </h4>
              <p className="text-sm text-muted-foreground">Enhancing with AI...</p>
            </div>
            <Badge variant="default">Processing</Badge>
          </div>
        </Card>
      ))}

      {/* Failed Enhancements */}
      {failedEnhancements.map(enhancement => (
        <Card key={enhancement.id} className="p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <h4 className="font-medium">
                {enhancement.products?.name || enhancement.images?.original_filename}
              </h4>
              <p className="text-sm text-muted-foreground">
                Enhancement failed: {enhancement.error_message}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRetryFailed(enhancement)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </Card>
      ))}

      {/* Completed Enhancements */}
      {completedEnhancements.map(enhancement => (
        <EnhancementSelectionCard
          key={enhancement.id}
          enhancement={enhancement}
          onSelectionChange={handleSelectionChange}
          onRegenerate={handleRegenerate}
        />
      ))}

      {/* Complete Button */}
      {completedEnhancements.length > 0 && pendingEnhancements.length === 0 && processingEnhancements.length === 0 && (
        <div className="flex justify-center pt-6">
          <Button onClick={onEnhancementComplete} className="px-8">
            <CheckCircle className="h-4 w-4 mr-2" />
            Continue to Content Review
          </Button>
        </div>
      )}
    </div>
  );
};

export default EnhancementReview; 
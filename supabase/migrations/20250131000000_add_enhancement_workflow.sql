-- Enhancement workflow database schema updates
-- Create enhancement queue table for tracking enhancement requests

CREATE TABLE IF NOT EXISTS public.enhancement_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('product', 'image')),
  content_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  original_image_url text NOT NULL,
  enhanced_image_url text,
  error_message text,
  regeneration_count integer DEFAULT 0,
  max_regenerations integer DEFAULT 3,
  regeneration_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhancement_queue_user_status ON public.enhancement_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_enhancement_queue_content ON public.enhancement_queue(content_type, content_id);

-- Add enhancement workflow columns to images table
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS enhancement_requested boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS user_selected_version text CHECK (user_selected_version IN ('original', 'enhanced')) DEFAULT 'original',
ADD COLUMN IF NOT EXISTS enhancement_history jsonb DEFAULT '[]'::jsonb;

-- Add enhancement workflow columns to products table  
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS user_selected_version text CHECK (user_selected_version IN ('original', 'enhanced')) DEFAULT 'original',
ADD COLUMN IF NOT EXISTS enhancement_history jsonb DEFAULT '[]'::jsonb;

-- Set ownership
ALTER TABLE public.enhancement_queue OWNER TO postgres;

-- Enable RLS
ALTER TABLE public.enhancement_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only access their own enhancement queue" ON public.enhancement_queue
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.enhancement_queue TO authenticated;
GRANT ALL ON public.enhancement_queue TO service_role; 
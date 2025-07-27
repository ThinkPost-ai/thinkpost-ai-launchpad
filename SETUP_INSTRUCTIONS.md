# 🚀 Setup Image Enhancement - Manual Steps

Since CLI tools need proper installation, let's apply the migration manually through the Supabase dashboard.

## Step 1: Apply Database Migration

1. **Open your Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste this SQL:**

```sql
-- Add image enhancement columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS enhanced_image_path TEXT,
ADD COLUMN IF NOT EXISTS image_enhancement_status TEXT DEFAULT 'none';

-- Add constraint for status values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'products_image_enhancement_status_check' 
        AND table_name = 'products'
    ) THEN
        ALTER TABLE products 
        ADD CONSTRAINT products_image_enhancement_status_check 
        CHECK (image_enhancement_status IN ('none', 'processing', 'completed', 'failed'));
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('enhanced_image_path', 'image_enhancement_status');
```

4. **Click "Run"** - You should see a result showing the new columns were added

## Step 2: Add OpenAI API Key

1. **In Supabase Dashboard**, go to:
   - Settings → Edge Functions → Environment Variables

2. **Add new variable:**
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (get one from https://platform.openai.com/api-keys)

3. **Save** the configuration

## Step 3: Deploy Edge Function

Since CLI isn't working, let's use npx to deploy the function:

```bash
cd /Users/yousefhm/Desktop/work/thinkpost-ai-launchpad
npx supabase functions deploy enhance-image
```

If npx doesn't work, you can manually upload the function through the dashboard:
1. Go to Edge Functions in your Supabase dashboard
2. Create new function named "enhance-image"
3. Copy the contents of `supabase/functions/enhance-image/index.ts`
4. Paste and deploy

## Step 4: Activate Enhancement Code

Once the migration is applied, I'll uncomment the code for you. Let me know when Step 1 is complete!

## Step 5: Test the Feature

1. Go to your upload page (`/upload`)
2. Add a product with an image
3. Enable the "Enhance Image" toggle
4. Click "Save"
5. Go to review page - you should see loading spinners
6. Wait for enhanced images to appear with sparkles icons

---

**Which step would you like to start with? I can help you through each one!** 
# Image to Video Conversion & TikTok Publishing Implementation

## Overview

This implementation provides a complete backend solution for converting images to TikTok-ready videos and publishing them directly to TikTok using the PULL_FROM_URL method.

## Architecture

### 1. Supabase Edge Functions

#### `convert-image-to-video`
- **Location**: `supabase/functions/convert-image-to-video/index.ts`
- **Purpose**: Converts uploaded images to 4-second MP4 videos optimized for TikTok
- **Features**:
  - Downloads images from provided URLs
  - Uses FFmpeg to create TikTok-compatible videos (1080x1920, 4 seconds)
  - Uploads converted videos to Supabase Storage
  - Returns public video URLs

#### `media-proxy`
- **Location**: `supabase/functions/media-proxy/index.ts`
- **Purpose**: Provides public URL access to videos stored in Supabase Storage
- **Features**:
  - Proxies requests to Supabase Storage
  - Handles CORS and caching headers
  - Maps custom domain URLs to storage URLs

#### `process-image-for-tiktok`
- **Location**: `supabase/functions/process-image-for-tiktok/index.ts`
- **Purpose**: Complete workflow handler from image upload to TikTok publishing
- **Features**:
  - Orchestrates image conversion process
  - Handles database record creation
  - Optionally publishes to TikTok
  - Returns comprehensive results

### 2. Database Schema Updates

#### Migration: `20241217_add_video_support_to_images.sql`
- Adds video support fields to the `images` table:
  - `url`: Direct storage URL
  - `public_url`: Public proxy URL
  - `file_name`: Original filename
  - `file_size`: File size in bytes
  - `mime_type`: MIME type (supports video/mp4)
- Creates indexes for performance optimization

### 3. Frontend Components

#### `useImageToVideo` Hook
- **Location**: `src/hooks/useImageToVideo.ts`
- **Purpose**: React hook for image-to-video conversion operations
- **Features**:
  - `convertImageOnly()`: Convert without publishing
  - `convertAndPublish()`: Convert and publish to TikTok
  - Loading states management
  - Error handling with toast notifications

#### `VideoConverter` Component
- **Location**: `src/components/dashboard/VideoConverter.tsx`
- **Purpose**: User interface for image-to-video conversion
- **Features**:
  - Drag & drop image upload
  - Real-time upload progress
  - Caption input for TikTok posts
  - Video preview and URL copying
  - Status indicators for all processing stages

## Usage Workflow

### 1. Image Upload
1. User selects/drops an image file
2. Image is uploaded to Supabase Storage (`restaurant-images` bucket)
3. Public URL is generated for the uploaded image

### 2. Video Conversion
1. User clicks "Convert to Video Only" or "Convert & Publish to TikTok"
2. `process-image-for-tiktok` function is called
3. Image is converted to MP4 using FFmpeg
4. Video is stored in `media` bucket with path: `{userId}/{sessionId}/final_video.mp4`
5. Public proxy URL is generated: `{supabase_url}/functions/v1/media-proxy/{userId}/{sessionId}/final_video.mp4`

### 3. TikTok Publishing (Optional)
1. If "Convert & Publish" is selected:
2. Scheduled post record is created
3. `post-to-tiktok` function is called with proxy URL
4. TikTok API is called using PULL_FROM_URL method
5. User receives confirmation of posting status

## Public URL Structure

Videos are accessible via the media proxy function:
```
{SUPABASE_URL}/functions/v1/media-proxy/{user_id}/{session_id}/final_video.mp4
```

This URL structure:
- Provides public access without authentication
- Can be easily mapped to custom domains
- Supports proper video streaming headers
- Includes caching for performance

## Environment Variables Required

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# TikTok API Configuration
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

## Storage Buckets

### `restaurant-images`
- **Purpose**: Store original uploaded images
- **Access**: Public read access
- **Path Structure**: `{user_id}/{timestamp}.{extension}`

### `media`
- **Purpose**: Store converted videos
- **Access**: Private (accessed via proxy)
- **Path Structure**: `{user_id}/{session_id}/final_video.mp4`

## TikTok Integration

The implementation uses TikTok's PULL_FROM_URL method:
- Videos must be accessible via public HTTPS URLs
- URLs must be from verified domains
- TikTok downloads and processes videos automatically
- Status updates are received via webhooks (existing implementation)

## Error Handling

- **Image Upload**: Validates file types, handles storage errors
- **Video Conversion**: FFmpeg error handling, cleanup of temporary files
- **TikTok Publishing**: API error handling, status tracking
- **User Feedback**: Toast notifications for all operations

## Performance Considerations

- **Async Processing**: All operations are non-blocking
- **Progress Indicators**: Real-time status updates
- **Caching**: Videos are cached with long expiration times
- **Cleanup**: Temporary files are automatically removed

## Security Features

- **Authentication**: All operations require user authentication
- **File Validation**: Image type and size validation
- **Path Sanitization**: Secure file path generation
- **CORS Handling**: Proper CORS headers for cross-origin requests

## Future Enhancements

1. **Custom Domain Mapping**: Map proxy URLs to custom domains
2. **Video Templates**: Multiple video templates and effects
3. **Batch Processing**: Convert multiple images simultaneously
4. **Analytics**: Track conversion and publishing metrics
5. **Webhook Integration**: Real-time TikTok status updates 
/// <reference types="https://deno.land/x/deno/cli/types/v1.28.0.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

// These must be set as environment variables in your Supabase project settings.
const VERIFY_TOKEN = Deno.env.get('INSTAGRAM_VERIFY_TOKEN');
const INSTAGRAM_APP_SECRET = Deno.env.get('INSTAGRAM_APP_SECRET');

serve(async (req) => {
  // 1. Check that environment variables are set
  if (!INSTAGRAM_APP_SECRET || !VERIFY_TOKEN) {
    console.error('A required environment variable (INSTAGRAM_APP_SECRET or INSTAGRAM_VERIFY_TOKEN) is not set.');
    return new Response('Internal Server Error: App not configured correctly.', { status: 500 });
  }

  // 2. Handle the verification request from Meta
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully!');
      return new Response(challenge, { status: 200 });
    } else {
      console.error('Webhook verification failed. Ensure your VERIFY_TOKEN is set correctly in both Supabase and the Facebook Developer Portal.');
      return new Response('Forbidden: Verification failed.', { status: 403 });
    }
  }

  // 3. Handle incoming event notifications
  if (req.method === 'POST') {
    const signature = req.headers.get('X-Hub-Signature-256');

    if (!signature) {
      console.error('Signature missing from webhook POST request.');
      return new Response('Bad Request: Signature missing.', { status: 400 });
    }

    const body = await req.text();
    
    // Validate the payload against the signature
    const hmac = createHmac('sha256', INSTAGRAM_APP_SECRET);
    hmac.update(body);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    if (signature !== expectedSignature) {
      console.error('Signature validation failed. Request might be fraudulent.');
      return new Response('Forbidden: Invalid signature.', { status: 403 });
    }

    console.log('Received valid webhook event:');
    console.log(JSON.stringify(JSON.parse(body), null, 2));

    // You can now process the webhook event data here.

    return new Response('OK', { status: 200 });
  }

  // 4. Handle other HTTP methods
  return new Response('Method Not Allowed', { status: 405 });
}) 
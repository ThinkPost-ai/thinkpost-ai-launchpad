/// <reference types="https://deno.land/x/deno/cli/types/v1.28.0.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

// These should be set as environment variables in your Supabase project.
const VERIFY_TOKEN = Deno.env.get('INSTAGRAM_VERIFY_TOKEN');
const INSTAGRAM_APP_SECRET = Deno.env.get('INSTAGRAM_APP_SECRET');

serve(async (req) => {
  // Check that environment variables are set
  if (!INSTAGRAM_APP_SECRET || !VERIFY_TOKEN) {
    console.error('A required environment variable (INSTAGRAM_APP_SECRET or INSTAGRAM_VERIFY_TOKEN) is not set.');
    return new Response('Internal Server Error: App not configured correctly.', { status: 500 });
  }

  if (req.method === 'GET') {
    // This is the verification request from Meta.
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully!');
      return new Response(challenge, { status: 200 });
    } else {
      console.error('Webhook verification failed.');
      return new Response('Forbidden', { status: 403 });
    }
  }

  if (req.method === 'POST') {
    // This is an event notification.
    const signature = req.headers.get('X-Hub-Signature-256');

    if (!signature) {
      console.error('Signature missing from webhook POST request.');
      return new Response('Bad Request: Signature missing.', { status: 400 });
    }

    const body = await req.text();
    
    // Validate the payload
    // https://developers.facebook.com/docs/graph-api/webhooks/getting-started#validate-payloads
    const hmac = createHmac('sha256', INSTAGRAM_APP_SECRET);
    hmac.update(body);
    const expectedSignature = `sha256=${hmac.digest('hex')}`;

    if (signature !== expectedSignature) {
      console.error('Signature validation failed. Request might be fraudulent.');
      return new Response('Forbidden: Invalid signature.', { status: 403 });
    }

    console.log('Received valid webhook event:');
    console.log(JSON.stringify(JSON.parse(body), null, 2));

    // Process the webhook event here...

    return new Response('OK', { status: 200 });
  }

  // Handle other methods
  return new Response('Method Not Allowed', { status: 405 });
}) 
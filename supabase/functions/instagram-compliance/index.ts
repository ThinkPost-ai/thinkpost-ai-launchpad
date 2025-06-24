import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

const INSTAGRAM_APP_SECRET = Deno.env.get('INSTAGRAM_APP_SECRET');

serve(async (req) => {
  if (!INSTAGRAM_APP_SECRET) {
    console.error('INSTAGRAM_APP_SECRET is not set.');
    return new Response('Internal Server Error: App not configured.', { status: 500 });
  }

  // Instagram sends a POST request to this endpoint.
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const body = await req.text();
  const data = new URLSearchParams(body);
  const signedRequest = data.get('signed_request');

  if (!signedRequest) {
    return new Response('Bad Request: Missing signed_request.', { status: 400 });
  }

  try {
    const [encodedSig, payload] = signedRequest.split('.');
    
    // 1. Decode the data
    const decodedSig = atob(encodedSig.replace(/_/g, '/').replace(/-/g, '+'));
    const decodedPayload = JSON.parse(atob(payload.replace(/_/g, '/').replace(/-/g, '+')));
    
    // 2. Validate the signature
    const hmac = createHmac('sha256', INSTAGRAM_APP_SECRET);
    hmac.update(payload); // Note: use the raw payload
    const expectedSig = hmac.digest();

    if (expectedSig.toString() !== decodedSig) {
      console.error("Signature validation failed. Request may be fraudulent.");
      return new Response('Forbidden: Invalid signature.', { status: 403 });
    }

    console.log('Received valid compliance request:', decodedPayload);

    const userId = decodedPayload.user_id;
    
    // You can determine the type of request from the URL path.
    // e.g. /deauthorize or /data-deletion
    const requestPath = new URL(req.url).pathname;

    if (requestPath.includes('deauthorize')) {
      console.log(`Received deauthorization request for user: ${userId}`);
      // TODO: Implement your deauthorization logic here.
      // e.g., delete the user's access token from your database.
    } else if (requestPath.includes('data-deletion')) {
      console.log(`Received data deletion request for user: ${userId}`);
      // TODO: Implement your data deletion logic here.
      // e.g., delete all data associated with this user.
      const confirmationCode = decodedPayload.confirmation_code;
      console.log(`Confirmation code: ${confirmationCode}`);
      // You must track the deletion status and provide updates.
    }
    
    // Respond with a confirmation code for data deletion requests
    // Or just a 200 OK for deauthorization
    const responsePayload = {
        url: `https://<YOUR_DOMAIN>/compliance/status/${decodedPayload.confirmation_code}`,
        confirmation_code: decodedPayload.confirmation_code,
    };

    return new Response(JSON.stringify(responsePayload), { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
    });

  } catch (error) {
    console.error("Error processing compliance request:", error);
    return new Response('Internal Server Error.', { status: 500 });
  }
}); 
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Admin delete user function called');
    
    // Get the service role client for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('✅ Service role client created');

    // Get the regular client for checking permissions
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Authorization header found');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    console.log('✅ Regular client created');

    // Verify the current user is an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ Invalid or expired token:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin permissions: ' + profileError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (profile?.role !== 'admin') {
      console.error('❌ User is not admin. Role:', profile?.role);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Admin role verified');

    // Parse request body
    const { userId } = await req.json();
    if (!userId) {
      console.error('❌ Missing userId parameter');
      return new Response(
        JSON.stringify({ error: 'Missing userId parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Request body parsed. UserId to delete:', userId);

    // Step 1: Try to sign out the user from all devices using admin privileges
    // Note: The database function will also invalidate sessions as a backup
    try {
      console.log('🔄 Attempting to sign out user globally using admin client...');
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(userId, 'global');
      if (signOutError) {
        console.error('⚠️ Admin signout failed:', signOutError.message);
        // Don't stop - the database function will handle session cleanup
      } else {
        console.log('✅ Successfully signed out user from all devices via admin');
      }
    } catch (signOutErr) {
      console.error('⚠️ Exception during admin signout:', signOutErr);
      // Don't stop - the database function will handle session cleanup
    }

    // Step 2: Delete user data using the database function
    // This function will also clean up sessions and tokens as a backup
    console.log('🔄 Attempting to delete user data...');
    const { error: deleteError } = await supabaseAdmin.rpc('delete_user_and_data', {
      user_id_to_delete: userId
    });

    if (deleteError) {
      console.error('❌ Error deleting user data:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user data: ' + deleteError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User data deleted successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully and logged out from all devices' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Unexpected error in admin-delete-user function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 
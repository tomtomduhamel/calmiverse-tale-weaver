import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 1. Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    
    // Create a supabase client to verify the user's token
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication Error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse request body
    const { targetUrl, payload } = await req.json();

    if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('https://n8n.')) {
      return new Response(
        JSON.stringify({ error: 'Bad Request: Invalid or missing targetUrl' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Inject N8N Webhook Secret
    const n8nSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    if (!n8nSecret) {
      console.error('SERVER ERROR: N8N_WEBHOOK_SECRET is not configured');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[trigger-n8n] User ${user.email} is calling ${targetUrl}...`);

    // 4. Call N8N
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Calmi-Webhook-Secret': n8nSecret
      },
      body: JSON.stringify(payload)
    });

    // Parse the response from N8N
    let result;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      result = await response.text();
      // If the text is valid JSON anyway, parse it
      try { result = JSON.parse(result); } catch (e) {}
    }

    if (!response.ok) {
      console.error(`[trigger-n8n] n8n responded with error ${response.status}:`, result);
      return new Response(
        JSON.stringify({ error: 'N8N Webhook Failed', details: result }), 
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[trigger-n8n] Success!`);

    // 5. Return the result back to the frontend
    return new Response(
      JSON.stringify(result), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[trigger-n8n] CRITICAL ERROR:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown internal error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

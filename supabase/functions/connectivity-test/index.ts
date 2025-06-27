
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`🔗 [CONNECTIVITY-TEST] ${req.method} request received at ${new Date().toISOString()}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`🔀 [CONNECTIVITY-TEST] CORS preflight handled`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    console.log(`📋 [CONNECTIVITY-TEST] Request body:`, body);
    
    const response = {
      success: true,
      message: "Edge Functions connectivity is working!",
      timestamp: new Date().toISOString(),
      method: req.method,
      userAgent: req.headers.get('user-agent'),
      origin: req.headers.get('origin'),
      receivedData: body
    };
    
    console.log(`✅ [CONNECTIVITY-TEST] Response:`, response);
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error(`❌ [CONNECTIVITY-TEST] Error:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`🧪 [TTS-TEST] ${req.method} request received at ${new Date().toISOString()}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`🔀 [TTS-TEST] CORS preflight handled`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    console.log(`📋 [TTS-TEST] Request body:`, body);
    
    const response = {
      success: true,
      message: "TTS Test function is working!",
      timestamp: new Date().toISOString(),
      method: req.method,
      receivedData: body,
      connectionStatus: "OK"
    };
    
    console.log(`✅ [TTS-TEST] Response:`, response);
    
    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error(`❌ [TTS-TEST] Error:`, error);
    
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

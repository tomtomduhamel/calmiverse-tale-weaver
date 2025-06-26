
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TTSRequest {
  text: string;
  voiceId?: string;
  modelId?: string;
  testConnection?: boolean;
}

serve(async (req) => {
  console.log(`🎙️ TTS-ElevenLabs - ${req.method} request received`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔀 CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`🔄 [${requestId}] Processing TTS request`);

  try {
    // Vérification de l'authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error(`❌ [${requestId}] No authorization header`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authorization required',
          timestamp: new Date().toISOString()
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialiser Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Vérifier l'utilisateur
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error(`❌ [${requestId}] Auth failed:`, authError?.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid authentication token',
          timestamp: new Date().toISOString()
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ [${requestId}] User authenticated: ${user.email}`);

    // Parse request body
    const { text, voiceId = '9BWtsMINqrJLrRacOk9x', modelId = 'eleven_multilingual_v2', testConnection = false } = await req.json() as TTSRequest;

    // Vérifier la clé API ElevenLabs
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error(`❌ [${requestId}] ElevenLabs API key not configured`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ElevenLabs API key not configured',
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Test de connexion si demandé
    if (testConnection) {
      console.log(`🔍 [${requestId}] Testing ElevenLabs connection`);
      
      try {
        const testResponse = await fetch('https://api.elevenlabs.io/v1/user', {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          }
        });

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error(`❌ [${requestId}] ElevenLabs test failed:`, errorText);
          
          return new Response(
            JSON.stringify({
              success: false,
              message: `ElevenLabs API test failed: ${testResponse.status}`,
              timestamp: new Date().toISOString()
            }),
            {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const userData = await testResponse.json();
        console.log(`✅ [${requestId}] ElevenLabs connection successful`);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'ElevenLabs connection successful',
            userInfo: userData.email || 'Connected user',
            timestamp: new Date().toISOString()
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } catch (error: any) {
        console.error(`❌ [${requestId}] Connection test error:`, error);
        return new Response(
          JSON.stringify({
            success: false,
            message: `Connection test failed: ${error.message}`,
            timestamp: new Date().toISOString()
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Validation du texte
    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Text is required and cannot be empty',
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Limiter la longueur du texte pour éviter les timeouts
    const maxLength = 2500;
    const processedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    
    console.log(`🎵 [${requestId}] Generating audio for ${processedText.length} characters`);

    // Générer l'audio avec ElevenLabs
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: processedText,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error(`❌ [${requestId}] ElevenLabs TTS failed:`, errorText);
      
      let errorMessage = `ElevenLabs error: ${ttsResponse.status}`;
      if (ttsResponse.status === 401) {
        errorMessage = 'Invalid ElevenLabs API key';
      } else if (ttsResponse.status === 429) {
        errorMessage = 'ElevenLabs quota exceeded';
      } else if (ttsResponse.status === 422) {
        errorMessage = 'Invalid voice parameters';
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Convertir l'audio en base64
    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    console.log(`✅ [${requestId}] Audio generated successfully - Size: ${audioBuffer.byteLength} bytes`);

    return new Response(
      JSON.stringify({
        success: true,
        audioContent: base64Audio,
        originalTextLength: text.length,
        processedTextLength: processedText.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error(`💥 [${requestId}] Unexpected error:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Unexpected error: ${error.message}`,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

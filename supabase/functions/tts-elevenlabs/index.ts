
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TTSRequest {
  text?: string;
  voiceId?: string;
  modelId?: string;
  testConnection?: boolean;
  ping?: boolean;
}

serve(async (req) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`🎙️ [${requestId}] TTS-ElevenLabs ${req.method} - Start`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log(`🔀 [${requestId}] CORS preflight handled`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    let requestBody: TTSRequest = {};
    try {
      requestBody = await req.json();
      console.log(`📋 [${requestId}] Request:`, { 
        hasText: !!requestBody.text, 
        textLength: requestBody.text?.length || 0,
        voiceId: requestBody.voiceId,
        testConnection: requestBody.testConnection,
        ping: requestBody.ping
      });
    } catch (parseError) {
      console.error(`❌ [${requestId}] JSON parse error:`, parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          requestId
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { text, voiceId = '9BWtsMINqrJLrRacOk9x', modelId = 'eleven_multilingual_v2', testConnection = false, ping = false } = requestBody;

    // Handle ping requests (no auth needed)
    if (ping) {
      console.log(`🏓 [${requestId}] Ping successful`);
      return new Response(
        JSON.stringify({
          success: true,
          message: 'ElevenLabs TTS function is operational',
          timestamp: new Date().toISOString(),
          requestId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check ElevenLabs API key
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error(`❌ [${requestId}] ElevenLabs API key not configured`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ELEVENLABS_API_KEY not configured in Supabase secrets',
          requestId
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Test connection if requested
    if (testConnection) {
      console.log(`🔍 [${requestId}] Testing ElevenLabs API connection`);
      
      try {
        const testResponse = await fetch('https://api.elevenlabs.io/v1/user', {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
          }
        });

        console.log(`📡 [${requestId}] ElevenLabs API test: ${testResponse.status}`);

        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error(`❌ [${requestId}] API test failed:`, errorText);
          
          return new Response(
            JSON.stringify({
              success: false,
              message: testResponse.status === 401 ? 'Clé API ElevenLabs invalide' : `Test API échoué: ${testResponse.status}`,
              requestId
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        const userData = await testResponse.json();
        console.log(`✅ [${requestId}] ElevenLabs connection successful`);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Connexion ElevenLabs réussie',
            userInfo: userData,
            requestId
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
            message: `Test de connexion échoué: ${error.message}`,
            requestId
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Validate text for audio generation
    if (!text || text.trim().length === 0) {
      console.error(`❌ [${requestId}] Empty text provided`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Text is required and cannot be empty',
          requestId
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate audio
    console.log(`🎵 [${requestId}] Generating audio: ${text.length} chars, voice: ${voiceId}`);

    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: text.substring(0, 2500), // Limit text length
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    console.log(`📡 [${requestId}] ElevenLabs TTS response: ${ttsResponse.status}`);

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error(`❌ [${requestId}] TTS generation failed:`, errorText);
      
      let errorMessage = `ElevenLabs TTS error: ${ttsResponse.status}`;
      if (ttsResponse.status === 401) {
        errorMessage = 'Clé API ElevenLabs invalide';
      } else if (ttsResponse.status === 429) {
        errorMessage = 'Quota ElevenLabs dépassé';
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          requestId
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    console.log(`🎉 [${requestId}] Audio generated successfully - Size: ${audioBuffer.byteLength} bytes`);

    return new Response(
      JSON.stringify({
        success: true,
        audioContent: base64Audio,
        textLength: text.length,
        voiceId,
        modelId,
        audioSizeBytes: audioBuffer.byteLength,
        requestId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error(`💥 [${requestId}] Global error:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur système inattendue',
        requestId
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

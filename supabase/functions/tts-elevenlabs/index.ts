
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TTSRequest {
  text?: string;
  voiceId?: string;
  modelId?: string;
  testConnection?: boolean;
  testSecrets?: boolean;
  ping?: boolean;
}

// Fonction pour segmenter le texte intelligemment
function segmentText(text: string, maxLength: number = 2500): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
  const segments: string[] = [];
  let currentSegment = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    if (currentSegment.length + trimmedSentence.length > maxLength && currentSegment.length > 0) {
      segments.push(currentSegment.trim());
      currentSegment = trimmedSentence;
    } else {
      currentSegment += (currentSegment.length > 0 ? ' ' : '') + trimmedSentence;
    }
  }
  
  if (currentSegment.trim().length > 0) {
    segments.push(currentSegment.trim());
  }

  return segments;
}

serve(async (req) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`🎙️ [${requestId}] TTS-ElevenLabs - ${req.method} request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`🔀 [${requestId}] CORS preflight handled`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body with better error handling
    let requestBody: TTSRequest = {};
    
    try {
      requestBody = await req.json();
      console.log(`📋 [${requestId}] Request:`, JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error(`❌ [${requestId}] JSON parse error:`, parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          requestId,
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { text, voiceId = '9BWtsMINqrJLrRacOk9x', modelId = 'eleven_multilingual_v2', testConnection = false, testSecrets = false, ping = false } = requestBody;

    // Handle ping requests
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

    // Handle secrets test
    if (testSecrets) {
      console.log(`🔐 [${requestId}] Testing secrets configuration`);
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const elevenLabsKey = Deno.env.get('ELEVENLABS_API_KEY');
      
      const secretsCheck = {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
        elevenLabsKey: !!elevenLabsKey,
        supabaseUrlLength: supabaseUrl?.length || 0,
        supabaseKeyLength: supabaseKey?.length || 0,
        elevenLabsKeyLength: elevenLabsKey?.length || 0,
      };
      
      console.log(`🔍 [${requestId}] Secrets status:`, secretsCheck);
      
      return new Response(
        JSON.stringify({
          success: secretsCheck.elevenLabsKey,
          message: secretsCheck.elevenLabsKey ? 'All secrets configured' : 'ELEVENLABS_API_KEY missing',
          details: secretsCheck,
          requestId,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Vérifier l'authentification pour les autres opérations
    const authHeader = req.headers.get('authorization');
    if (!authHeader && !testConnection && !ping) {
      console.error(`❌ [${requestId}] No authorization header`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Authorization required for TTS operations',
          requestId,
          timestamp: new Date().toISOString()
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Vérifier la clé API ElevenLabs
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error(`❌ [${requestId}] ElevenLabs API key not configured`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'ELEVENLABS_API_KEY not configured in Supabase secrets',
          requestId,
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
          let errorMessage = `ElevenLabs API test failed: ${testResponse.status}`;
          
          if (testResponse.status === 401) {
            errorMessage = 'Clé API ElevenLabs invalide ou expirée';
          } else if (testResponse.status === 429) {
            errorMessage = 'Limite de quota ElevenLabs atteinte';
          }
          
          return new Response(
            JSON.stringify({
              success: false,
              message: errorMessage,
              details: { status: testResponse.status, response: errorText },
              requestId,
              timestamp: new Date().toISOString()
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
            requestId,
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
            message: `Test de connexion échoué: ${error.message}`,
            requestId,
            timestamp: new Date().toISOString()
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Validation du texte pour génération audio
    if (!text || text.trim().length === 0) {
      console.error(`❌ [${requestId}] Empty text provided`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Text is required and cannot be empty',
          requestId,
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Segmentation du texte
    const segments = segmentText(text, 2500);
    const processedText = segments[0];

    if (segments.length > 1) {
      console.log(`⚠️ [${requestId}] Text segmented - processing first segment (${processedText.length}/${text.length} chars)`);
    }

    console.log(`🎵 [${requestId}] Generating audio: ${processedText.length} chars, voice: ${voiceId}, model: ${modelId}`);

    // Génération audio avec timeout et retry
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ [${requestId}] Request timeout (30s)`);
      controller.abort();
    }, 30000);

    try {
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
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log(`📡 [${requestId}] ElevenLabs TTS response: ${ttsResponse.status}`);

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error(`❌ [${requestId}] TTS generation failed (${ttsResponse.status}):`, errorText);
        
        let errorMessage = `ElevenLabs TTS error: ${ttsResponse.status}`;
        if (ttsResponse.status === 401) {
          errorMessage = 'Clé API ElevenLabs invalide';
        } else if (ttsResponse.status === 429) {
          errorMessage = 'Quota ElevenLabs dépassé';
        } else if (ttsResponse.status === 422) {
          errorMessage = 'Paramètres de voix invalides';
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            error: errorMessage,
            details: { status: ttsResponse.status, response: errorText },
            requestId,
            timestamp: new Date().toISOString()
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
          originalTextLength: text.length,
          processedTextLength: processedText.length,
          voiceId,
          modelId,
          audioSizeBytes: audioBuffer.byteLength,
          requestId,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error(`💥 [${requestId}] TTS generation error:`, error);
      
      let errorMessage = error.message || 'Erreur inconnue lors de la génération audio';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout: Génération audio trop longue (30s)';
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          requestId,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error: any) {
    console.error(`💥 [${requestId}] Global error:`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur système inattendue',
        requestId,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

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

// Fonction pour segmenter le texte intelligemment - Version consolidée 2025
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
  console.log(`🎙️ TTS-ElevenLabs CONSOLIDÉ - ${req.method} request received`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔀 CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`🔄 [${requestId}] Processing TTS request - Version consolidée`);

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
            message: 'Connexion ElevenLabs réussie',
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
            message: `Test de connexion échoué: ${error.message}`,
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

    // Segmentation du texte
    const segments = segmentText(text, 2500);
    const processedText = segments[0];

    if (segments.length > 1) {
      console.log(`⚠️ [${requestId}] Texte segmenté - traitement du premier segment (${processedText.length}/${text.length} chars)`);
    }

    console.log(`🎵 [${requestId}] Generating audio for ${processedText.length} characters`);

    // Configuration avec retry
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ [${requestId}] Timeout de 30 secondes atteint`);
      controller.abort();
    }, 30000);

    let lastError: any = null;
    let audioBuffer: ArrayBuffer | null = null;

    // Système de retry avec backoff exponentiel
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 [${requestId}] Tentative ${attempt}/3`);
        
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

        if (!ttsResponse.ok) {
          const errorText = await ttsResponse.text();
          console.error(`❌ [${requestId}] ElevenLabs TTS failed attempt ${attempt} (${ttsResponse.status}):`, errorText);
          
          let errorMessage = `ElevenLabs error: ${ttsResponse.status}`;
          if (ttsResponse.status === 401) {
            errorMessage = 'Clé API ElevenLabs invalide';
            throw new Error(errorMessage);
          } else if (ttsResponse.status === 429) {
            errorMessage = 'Quota ElevenLabs dépassé';
          } else if (ttsResponse.status === 422) {
            errorMessage = 'Paramètres de voix invalides';
            throw new Error(errorMessage);
          }
          
          lastError = new Error(errorMessage);
          
          if (attempt < 3 && (ttsResponse.status >= 500 || ttsResponse.status === 429)) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`⏳ [${requestId}] Attente ${delay}ms avant retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw lastError;
        }

        audioBuffer = await ttsResponse.arrayBuffer();
        console.log(`✅ [${requestId}] Audio généré avec succès - Taille: ${audioBuffer.byteLength} bytes`);
        break;

      } catch (error: any) {
        lastError = error;
        console.error(`💥 [${requestId}] Erreur tentative ${attempt}:`, error.message);
        
        if (error.name === 'AbortError') {
          throw new Error('Timeout: Génération audio trop longue (30s)');
        }
        
        if (attempt === 3) {
          throw error;
        }
      }
    }

    clearTimeout(timeoutId);

    if (!audioBuffer) {
      throw lastError || new Error('Impossible de générer l\'audio après 3 tentatives');
    }

    // Convertir en base64
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    console.log(`🎉 [${requestId}] Génération terminée avec succès`);

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
    console.error(`💥 [${requestId}] Erreur dans tts-elevenlabs:`, error);
    
    let errorMessage = error.message || 'Erreur inconnue lors de la génération audio';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout: Génération audio trop longue. Essayez avec un texte plus court.';
    } else if (errorMessage.includes('Clé API')) {
      errorMessage = 'Configuration ElevenLabs incorrecte. Vérifiez votre clé API.';
    } else if (errorMessage.includes('quota')) {
      errorMessage = 'Limite ElevenLabs atteinte. Vérifiez votre plan.';
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
});

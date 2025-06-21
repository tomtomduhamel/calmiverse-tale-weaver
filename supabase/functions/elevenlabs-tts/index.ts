
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎙️ ElevenLabs TTS - Début de la requête');
    
    const { text, voiceId = '9BWtsMINqrJLrRacOk9x', modelId = 'eleven_multilingual_v2' } = await req.json();

    if (!text || text.trim().length === 0) {
      throw new Error('Le texte est requis et ne peut pas être vide');
    }

    // Limiter le texte à 1000 caractères pour éviter les timeouts
    const limitedText = text.slice(0, 1000);
    if (text.length > 1000) {
      console.log(`⚠️ Texte tronqué de ${text.length} à 1000 caractères`);
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error('❌ Clé API ElevenLabs non configurée');
      throw new Error('Clé API ElevenLabs non configurée dans les secrets Supabase');
    }

    console.log(`🎵 Génération audio - Voix: ${voiceId}, Modèle: ${modelId}, Longueur: ${limitedText.length}`);

    // Appel à l'API ElevenLabs avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: limitedText,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erreur ElevenLabs (${response.status}):`, errorText);
      
      let errorMessage = `Erreur ElevenLabs: ${response.status}`;
      if (response.status === 401) {
        errorMessage = 'Clé API ElevenLabs invalide ou expirée';
      } else if (response.status === 429) {
        errorMessage = 'Limite de quota ElevenLabs atteinte';
      } else if (response.status === 422) {
        errorMessage = 'Paramètres de synthèse vocale invalides';
      }
      
      throw new Error(errorMessage);
    }

    // Convertir la réponse audio en base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    console.log(`✅ Audio généré avec succès - Taille: ${audioBuffer.byteLength} bytes`);

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        success: true,
        originalTextLength: text.length,
        processedTextLength: limitedText.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('💥 Erreur dans elevenlabs-tts:', error);
    
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout: La génération audio a pris trop de temps';
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

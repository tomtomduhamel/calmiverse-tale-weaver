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

interface TTSResponse {
  audioContent?: string;
  success: boolean;
  originalTextLength?: number;
  processedTextLength?: number;
  error?: string;
  timestamp?: string;
  segments?: Array<{text: string, length: number}>;
}

// Fonction pour segmenter le texte intelligemment par phrases
function segmentTextBySentences(text: string, maxLength: number = 2500): string[] {
  console.log(`📝 Segmentation du texte: ${text.length} caractères`);
  
  if (text.length <= maxLength) {
    return [text];
  }

  // Découper par phrases d'abord
  const sentences = text.match(/[^\.!?]+[\.!?]+/g) || [text];
  const segments: string[] = [];
  let currentSegment = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    // Si ajouter cette phrase dépasse la limite, sauvegarder le segment actuel
    if (currentSegment.length + trimmedSentence.length > maxLength && currentSegment.length > 0) {
      segments.push(currentSegment.trim());
      currentSegment = trimmedSentence;
    } else {
      currentSegment += (currentSegment.length > 0 ? ' ' : '') + trimmedSentence;
    }
  }
  
  // Ajouter le dernier segment
  if (currentSegment.trim().length > 0) {
    segments.push(currentSegment.trim());
  }

  console.log(`✂️ Texte segmenté en ${segments.length} parties:`, segments.map(s => s.length));
  return segments;
}

// Fonction pour valider la configuration ElevenLabs
async function validateElevenLabsConfig(apiKey: string): Promise<{valid: boolean, error?: string}> {
  try {
    console.log('🔐 Validation de la clé API ElevenLabs...');
    
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Validation échouée (${response.status}):`, errorText);
      
      if (response.status === 401) {
        return { valid: false, error: 'Clé API invalide ou expirée' };
      } else if (response.status === 429) {
        return { valid: false, error: 'Limite de quota atteinte' };
      }
      
      return { valid: false, error: `Erreur API: ${response.status}` };
    }

    const userData = await response.json();
    console.log('✅ Clé API valide pour:', userData.email || 'utilisateur');
    return { valid: true };
    
  } catch (error) {
    console.error('💥 Erreur lors de la validation:', error);
    return { valid: false, error: `Erreur de connexion: ${error.message}` };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  console.log(`🎙️ [${requestId}] ElevenLabs TTS - Début de la requête`);

  try {
    // Vérification de l'authentification JWT
    const authHeader = req.headers.get('authorization');
    console.log(`🔑 [${requestId}] Auth header présent:`, !!authHeader);
    
    if (!authHeader) {
      console.error(`❌ [${requestId}] Aucun header d'autorisation trouvé`);
      return new Response(
        JSON.stringify({
          error: 'Authentification requise',
          success: false,
          timestamp: new Date().toISOString()
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialiser le client Supabase pour vérifier l'auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error(`❌ [${requestId}] Configuration Supabase manquante`);
      throw new Error('Configuration Supabase incomplète');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Extraire le JWT du header Authorization
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error(`❌ [${requestId}] Erreur d'authentification:`, authError);
      return new Response(
        JSON.stringify({
          error: 'Token d\'authentification invalide',
          success: false,
          timestamp: new Date().toISOString()
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ [${requestId}] Utilisateur authentifié:`, user.email);

    const requestBody: TTSRequest = await req.json();
    const { text, voiceId = '9BWtsMINqrJLrRacOk9x', modelId = 'eleven_multilingual_v2', testConnection = false } = requestBody;

    console.log(`📥 [${requestId}] Paramètres reçus:`, {
      textLength: text?.length || 0,
      voiceId,
      modelId,
      testConnection
    });

    // Validation des paramètres d'entrée
    if (!testConnection && (!text || text.trim().length === 0)) {
      throw new Error('Le texte est requis et ne peut pas être vide');
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error(`❌ [${requestId}] Clé API ElevenLabs non configurée`);
      throw new Error('Clé API ElevenLabs non configurée dans les secrets Supabase. Vérifiez que le nom du secret est exactement "ELEVENLABS_API_KEY"');
    }

    // Test de connexion si demandé
    if (testConnection) {
      console.log(`🔍 [${requestId}] Test de connexion demandé`);
      const validation = await validateElevenLabsConfig(ELEVENLABS_API_KEY);
      
      return new Response(
        JSON.stringify({
          success: validation.valid,
          message: validation.valid ? 'Connexion ElevenLabs réussie' : validation.error,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Segmentation intelligente du texte
    const segments = segmentTextBySentences(text, 2500);
    const selectedText = segments[0]; // Pour l'instant, on traite le premier segment

    if (segments.length > 1) {
      console.log(`⚠️ [${requestId}] Texte trop long, traitement du premier segment (${selectedText.length}/${text.length} caractères)`);
    }

    console.log(`🎵 [${requestId}] Génération audio - Voix: ${voiceId}, Modèle: ${modelId}, Longueur: ${selectedText.length}`);

    // Configuration de l'appel API avec retry
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ [${requestId}] Timeout de 45 secondes atteint`);
      controller.abort();
    }, 45000); // Augmenté à 45 secondes

    let lastError: any = null;
    let audioBuffer: ArrayBuffer | null = null;

    // Système de retry avec backoff exponentiel
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 [${requestId}] Tentative ${attempt}/3`);
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: selectedText,
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

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ [${requestId}] Erreur ElevenLabs tentative ${attempt} (${response.status}):`, errorText);
          
          let errorMessage = `Erreur ElevenLabs: ${response.status}`;
          if (response.status === 401) {
            errorMessage = 'Clé API ElevenLabs invalide ou expirée. Vérifiez votre configuration.';
            throw new Error(errorMessage); // Pas de retry pour erreur d'auth
          } else if (response.status === 429) {
            errorMessage = 'Limite de quota ElevenLabs atteinte. Attendez avant de réessayer.';
          } else if (response.status === 422) {
            errorMessage = 'Paramètres de synthèse vocale invalides. Vérifiez la voix sélectionnée.';
            throw new Error(errorMessage); // Pas de retry pour erreur de paramètres
          }
          
          lastError = new Error(errorMessage);
          
          // Retry seulement pour certaines erreurs
          if (attempt < 3 && (response.status >= 500 || response.status === 429)) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            console.log(`⏳ [${requestId}] Attente ${delay}ms avant retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw lastError;
        }

        // Succès
        audioBuffer = await response.arrayBuffer();
        console.log(`✅ [${requestId}] Audio généré avec succès - Taille: ${audioBuffer.byteLength} bytes`);
        break;

      } catch (error: any) {
        lastError = error;
        console.error(`💥 [${requestId}] Erreur tentative ${attempt}:`, error.message);
        
        if (error.name === 'AbortError') {
          throw new Error('Timeout: La génération audio a pris trop de temps (45s)');
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

    const response: TTSResponse = {
      audioContent: base64Audio,
      success: true,
      originalTextLength: text.length,
      processedTextLength: selectedText.length,
      timestamp: new Date().toISOString(),
      segments: segments.length > 1 ? segments.map(s => ({text: s.substring(0, 50) + '...', length: s.length})) : undefined
    };

    console.log(`🎉 [${requestId}] Génération terminée avec succès`);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error(`💥 [${requestId}] Erreur dans elevenlabs-tts:`, error);
    
    let errorMessage = error.message || 'Erreur inconnue lors de la génération audio';
    
    // Messages d'erreur contextuels
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout: La génération audio a pris trop de temps. Essayez avec un texte plus court.';
    } else if (errorMessage.includes('Clé API')) {
      errorMessage = 'Configuration ElevenLabs incorrecte. Vérifiez votre clé API dans les paramètres du projet.';
    } else if (errorMessage.includes('quota')) {
      errorMessage = 'Limite ElevenLabs atteinte. Vérifiez votre plan ou attendez le renouvellement.';
    }

    const errorResponse: TTSResponse = {
      error: errorMessage,
      success: false,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

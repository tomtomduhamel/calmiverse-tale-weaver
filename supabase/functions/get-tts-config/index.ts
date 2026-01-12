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
    // Récupérer le provider TTS configuré (elevenlabs ou speechify)
    const ttsProvider = Deno.env.get('TTS_PROVIDER') || 'elevenlabs';
    
    console.log(`[get-tts-config] Checking TTS configuration for provider: ${ttsProvider}`);
    
    let webhookUrl: string;
    let voiceId: string | null = null;
    
    // Sélectionner l'URL webhook selon le provider
    if (ttsProvider === 'speechify' || ttsProvider === 'Speechify') {
      const speechifyUrl = Deno.env.get('N8N_SPEECHIFY_WEBHOOK_URL');
      console.log(`[get-tts-config] Speechify webhook URL check: ${speechifyUrl ? 'FOUND' : 'NOT FOUND'}`);
      webhookUrl = speechifyUrl || '';
      voiceId = 'b09ef0e3-8257-4a43-8431-a104f81561c2'; // Voice ID Speechify par défaut
    } else {
      // Par défaut ou si 'elevenlabs'
      const elevenlabsUrl = Deno.env.get('N8N_WEBHOOK_URL');
      console.log(`[get-tts-config] ElevenLabs webhook URL check: ${elevenlabsUrl ? 'FOUND' : 'NOT FOUND'}`);
      webhookUrl = elevenlabsUrl || '';
      voiceId = '9BWtsMINqrJLrRacOk9x'; // Voice ID ElevenLabs par défaut
    }
    
    if (!webhookUrl) {
      const availableSecrets = {
        TTS_PROVIDER: Deno.env.get('TTS_PROVIDER') ? 'SET' : 'NOT SET',
        N8N_WEBHOOK_URL: Deno.env.get('N8N_WEBHOOK_URL') ? 'SET' : 'NOT SET',
        N8N_SPEECHIFY_WEBHOOK_URL: Deno.env.get('N8N_SPEECHIFY_WEBHOOK_URL') ? 'SET' : 'NOT SET'
      };
      console.error(`[get-tts-config] Missing webhook URL. Current secrets status:`, availableSecrets);
      throw new Error(`Webhook URL not configured for provider: ${ttsProvider}. Please verify that ${ttsProvider === 'speechify' ? 'N8N_SPEECHIFY_WEBHOOK_URL' : 'N8N_WEBHOOK_URL'} is set in Supabase Secrets.`);
    }
    
    console.log(`TTS Config requested - Provider: ${ttsProvider}, URL: ${webhookUrl.substring(0, 30)}...`);
    
    return new Response(
      JSON.stringify({
        provider: ttsProvider,
        webhookUrl,
        voiceId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-tts-config function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        provider: 'elevenlabs', // Fallback par défaut
        webhookUrl: Deno.env.get('N8N_WEBHOOK_URL') || '',
        voiceId: '9BWtsMINqrJLrRacOk9x',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

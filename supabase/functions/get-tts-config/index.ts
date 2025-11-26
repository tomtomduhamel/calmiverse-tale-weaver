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
    
    let webhookUrl: string;
    let voiceId: string | null = null;
    
    // Sélectionner l'URL webhook selon le provider
    if (ttsProvider === 'speechify') {
      webhookUrl = Deno.env.get('N8N_SPEECHIFY_WEBHOOK_URL') || '';
      // Speechify gère le voice_id dans n8n
      voiceId = null;
    } else {
      // Par défaut ou si 'elevenlabs'
      webhookUrl = Deno.env.get('N8N_WEBHOOK_URL') || '';
      voiceId = '9BWtsMINqrJLrRacOk9x'; // Voice ID ElevenLabs par défaut
    }
    
    if (!webhookUrl) {
      throw new Error(`Webhook URL not configured for provider: ${ttsProvider}`);
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
    return new Response(
      JSON.stringify({ 
        error: error.message,
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

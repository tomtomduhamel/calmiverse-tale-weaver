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
    // Récupérer le provider TTS configuré (vps-hostinger, elevenlabs ou speechify)
    const ttsProvider = Deno.env.get('TTS_PROVIDER') || 'vps-hostinger';
    
    console.log(`[get-tts-config] Checking TTS configuration for provider: ${ttsProvider}`);
    
    let webhookUrl: string;
    let voiceId: string | null = null;
    
    const DEFAULT_N8N_WEBHOOK = "https://n8n.srv856374.hstgr.cloud/webhook/d2d88f5d-78c0-49c1-83b8-096d4b21190c";
    
    // Sélectionner l'URL webhook selon le provider
    if (ttsProvider === 'speechify' || ttsProvider === 'Speechify') {
      webhookUrl = Deno.env.get('N8N_SPEECHIFY_WEBHOOK_URL') || DEFAULT_N8N_WEBHOOK;
      voiceId = 'b09ef0e3-8257-4a43-8431-a104f81561c2';
    } else if (ttsProvider === 'vps-hostinger' || ttsProvider === 'vps') {
      webhookUrl = Deno.env.get('N8N_SPEECHIFY_WEBHOOK_URL') || Deno.env.get('N8N_WEBHOOK_URL') || DEFAULT_N8N_WEBHOOK;
      voiceId = '9BWtsMINqrJLrRacOk9x';
    } else {
      webhookUrl = Deno.env.get('N8N_WEBHOOK_URL') || DEFAULT_N8N_WEBHOOK;
      voiceId = '9BWtsMINqrJLrRacOk9x';
    }
    
    if (!webhookUrl) {
      webhookUrl = DEFAULT_N8N_WEBHOOK;
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
        provider: 'vps-hostinger', // Fallback par défaut
        webhookUrl: Deno.env.get('N8N_SPEECHIFY_WEBHOOK_URL') || '',
        voiceId: '9BWtsMINqrJLrRacOk9x',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

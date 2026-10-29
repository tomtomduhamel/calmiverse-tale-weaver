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
    // Récupérer le provider TTS configuré (modal-gpu, vps-hostinger, kokoro)
    const ttsProvider = Deno.env.get('TTS_PROVIDER') || 'modal-gpu';
    
    console.log(`[get-tts-config] Checking TTS configuration for provider: ${ttsProvider}`);
    
    let webhookUrl: string;
    let voiceId: string = 'standard-french-female';
    
    const MODAL_ASYNC_WEBHOOK = "https://tomtom-duhamel--calmi-tts-service-synthesize-async-fast.modal.run";
    const DEFAULT_N8N_WEBHOOK = "https://n8n.srv856374.hstgr.cloud/webhook/d2d88f5d-78c0-49c1-83b8-096d4b21190c";
    const DEFAULT_VPS_KOKORO_WEBHOOK = Deno.env.get('VPS_KOKORO_WEBHOOK_URL') || DEFAULT_N8N_WEBHOOK;
    
    // Sélectionner l'URL webhook selon le provider
    if (ttsProvider === 'modal-gpu' || ttsProvider === 'modal') {
      webhookUrl = Deno.env.get('MODAL_TTS_WEBHOOK_URL') || MODAL_ASYNC_WEBHOOK;
      voiceId = 'standard-french-female';
    } else if (ttsProvider === 'vps-hostinger' || ttsProvider === 'vps' || ttsProvider === 'kokoro') {
      webhookUrl = DEFAULT_VPS_KOKORO_WEBHOOK;
      voiceId = 'standard-french-female';
    } else {
      webhookUrl = Deno.env.get('N8N_WEBHOOK_URL') || DEFAULT_N8N_WEBHOOK;
      voiceId = 'standard-french-female';
    }
    
    if (!webhookUrl) {
      webhookUrl = MODAL_ASYNC_WEBHOOK;
    }
    
    console.log(`TTS Config requested - Provider: ${ttsProvider}, URL: ${webhookUrl.substring(0, 45)}...`);
    
    return new Response(
      JSON.stringify({
        provider: ttsProvider,
        webhookUrl,
        modalWebhookUrl: Deno.env.get('MODAL_TTS_WEBHOOK_URL') || MODAL_ASYNC_WEBHOOK,
        standardWebhookUrl: DEFAULT_VPS_KOKORO_WEBHOOK,
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
        provider: 'modal-gpu', // Fallback par défaut
        webhookUrl: "https://tomtom-duhamel--calmi-tts-service-synthesize-async-fast.modal.run",
        modalWebhookUrl: "https://tomtom-duhamel--calmi-tts-service-synthesize-async-fast.modal.run",
        standardWebhookUrl: "https://n8n.srv856374.hstgr.cloud/webhook/d2d88f5d-78c0-49c1-83b8-096d4b21190c",
        voiceId: 'standard-french-female',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

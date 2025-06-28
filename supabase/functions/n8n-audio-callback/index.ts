
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

interface N8nCallbackPayload {
  requestId: string;
  status: 'success' | 'error';
  audioUrl?: string;
  fileSize?: number;
  duration?: number;
  error?: string;
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`🔗 [n8n-audio-callback-${requestId}] NOUVELLE REQUÊTE ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Initialiser le client Supabase avec la clé service
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Lire le corps de la requête
    const body: N8nCallbackPayload = await req.json();
    console.log(`📥 [n8n-audio-callback-${requestId}] Callback reçu:`, body);

    const { requestId: webhookId, status, audioUrl, fileSize, duration, error } = body;

    if (!webhookId) {
      throw new Error('requestId manquant dans le callback');
    }

    // Trouver le fichier audio correspondant
    const { data: audioFile, error: findError } = await supabase
      .from('audio_files')
      .select('*')
      .eq('webhook_id', webhookId)
      .single();

    if (findError) {
      console.error(`❌ [n8n-audio-callback-${requestId}] Fichier non trouvé:`, findError);
      throw new Error(`Fichier audio non trouvé pour requestId: ${webhookId}`);
    }

    console.log(`📁 [n8n-audio-callback-${requestId}] Fichier trouvé:`, audioFile.id);

    // Mettre à jour le fichier audio selon le statut
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (status === 'success') {
      updateData.status = 'ready';
      updateData.audio_url = audioUrl;
      if (fileSize) updateData.file_size = fileSize;
      if (duration) updateData.duration = duration;
      
      console.log(`✅ [n8n-audio-callback-${requestId}] Marquage comme prêt`);
    } else {
      updateData.status = 'error';
      updateData.error = error || 'Erreur lors de la génération audio';
      
      console.log(`❌ [n8n-audio-callback-${requestId}] Marquage comme erreur:`, error);
    }

    // Appliquer la mise à jour
    const { error: updateError } = await supabase
      .from('audio_files')
      .update(updateData)
      .eq('id', audioFile.id);

    if (updateError) {
      console.error(`💥 [n8n-audio-callback-${requestId}] Erreur mise à jour:`, updateError);
      throw new Error(`Erreur mise à jour: ${updateError.message}`);
    }

    console.log(`🎉 [n8n-audio-callback-${requestId}] Fichier audio mis à jour avec succès`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Callback traité avec succès',
        audioFileId: audioFile.id,
        requestId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error(`💥 [n8n-audio-callback-${requestId}] ERREUR:`, error.message);

    return new Response(
      JSON.stringify({
        error: true,
        message: error.message,
        requestId
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

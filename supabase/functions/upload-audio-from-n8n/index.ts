
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

interface N8nUploadPayload {
  requestId: string;
  storyId: string;
  audioFile: File;
  voiceId?: string;
  duration?: number;
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`🎵 [upload-audio-from-n8n-${requestId}] NOUVELLE REQUÊTE ${req.method}`);

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

    // Lire les données multipart/form-data
    const formData = await req.formData();
    const webhookId = formData.get('requestId') as string;
    const storyId = formData.get('storyId') as string;
    const audioFile = formData.get('audioFile') as File;
    const voiceId = formData.get('voiceId') as string || '9BWtsMINqrJLrRacOk9x';
    const duration = formData.get('duration') ? parseInt(formData.get('duration') as string) : null;

    console.log(`📥 [upload-audio-from-n8n-${requestId}] Données reçues:`, {
      webhookId,
      storyId,
      audioFileName: audioFile?.name,
      audioFileSize: audioFile?.size,
      voiceId,
      duration
    });

    // Validation des données obligatoires
    if (!webhookId) {
      throw new Error('requestId manquant');
    }

    if (!storyId) {
      throw new Error('storyId manquant');
    }

    if (!audioFile) {
      throw new Error('Fichier audio manquant');
    }

    // Vérifier que le fichier est bien un audio
    if (!audioFile.type.startsWith('audio/')) {
      throw new Error('Le fichier doit être un fichier audio');
    }

    // Trouver l'entrée correspondante dans audio_files
    const { data: audioFileRecord, error: findError } = await supabase
      .from('audio_files')
      .select('*')
      .eq('webhook_id', webhookId)
      .single();

    if (findError) {
      console.error(`❌ [upload-audio-from-n8n-${requestId}] Fichier non trouvé:`, findError);
      throw new Error(`Fichier audio non trouvé pour requestId: ${webhookId}`);
    }

    console.log(`📁 [upload-audio-from-n8n-${requestId}] Fichier trouvé:`, audioFileRecord.id);

    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const fileExtension = audioFile.name.split('.').pop() || 'mp3';
    const fileName = `${storyId}/${webhookId}-${timestamp}.${fileExtension}`;

    console.log(`📤 [upload-audio-from-n8n-${requestId}] Upload vers Storage:`, fileName);

    // Convertir le File en ArrayBuffer pour Supabase Storage
    const fileBuffer = await audioFile.arrayBuffer();

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, fileBuffer, {
        contentType: audioFile.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error(`💥 [upload-audio-from-n8n-${requestId}] Erreur upload:`, uploadError);
      
      // Marquer comme erreur dans la base
      await supabase
        .from('audio_files')
        .update({ 
          status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', audioFileRecord.id);

      throw new Error(`Erreur upload: ${uploadError.message}`);
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('audio-files')
      .getPublicUrl(uploadData.path);

    console.log(`🔗 [upload-audio-from-n8n-${requestId}] URL publique générée:`, urlData.publicUrl);

    // Mettre à jour l'enregistrement audio_files
    const updateData: any = {
      status: 'ready',
      audio_url: urlData.publicUrl,
      file_size: audioFile.size,
      updated_at: new Date().toISOString()
    };

    if (duration) {
      updateData.duration = duration;
    }

    const { error: updateError } = await supabase
      .from('audio_files')
      .update(updateData)
      .eq('id', audioFileRecord.id);

    if (updateError) {
      console.error(`💥 [upload-audio-from-n8n-${requestId}] Erreur mise à jour:`, updateError);
      throw new Error(`Erreur mise à jour: ${updateError.message}`);
    }

    console.log(`🎉 [upload-audio-from-n8n-${requestId}] Upload et mise à jour réussis !`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Fichier audio uploadé avec succès',
        audioFileId: audioFileRecord.id,
        audioUrl: urlData.publicUrl,
        fileName: uploadData.path,
        requestId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error(`💥 [upload-audio-from-n8n-${requestId}] ERREUR:`, error.message);

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

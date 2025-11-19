
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

// Validation schema pour FormData
const UploadFormDataSchema = z.object({
  requestId: z.string().min(1, "requestId requis"),
  storyId: z.string().uuid("storyId invalide"),
  voiceId: z.string().optional(),
  duration: z.number().positive().optional()
});

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`🎵 [upload-audio-from-n8n-${requestId}] NOUVELLE REQUÊTE ${req.method}`);
  console.log(`🎵 [upload-audio-from-n8n-${requestId}] URL:`, req.url);
  console.log(`🎵 [upload-audio-from-n8n-${requestId}] Headers:`, Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ [upload-audio-from-n8n-${requestId}] CORS preflight handled`);
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    console.error(`❌ [upload-audio-from-n8n-${requestId}] Méthode non autorisée:`, req.method);
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Vérification du secret webhook
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    
    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.error(`❌ [upload-audio-from-n8n-${requestId}] Secret webhook invalide ou manquant`);
      return new Response(
        JSON.stringify({ error: 'Authentification webhook invalide' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ [upload-audio-from-n8n-${requestId}] Secret webhook validé`);

    // Vérifier les variables d'environnement
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log(`🔧 [upload-audio-from-n8n-${requestId}] Variables d'environnement:`, {
      supabaseUrl: supabaseUrl ? '✅ Présente' : '❌ Manquante',
      supabaseServiceKey: supabaseServiceKey ? '✅ Présente' : '❌ Manquante'
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variables d\'environnement Supabase manquantes');
    }
    
    console.log(`📋 [upload-audio-from-n8n-${requestId}] Initialisation du client Supabase`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Informations sur la requête
    console.log(`📦 [upload-audio-from-n8n-${requestId}] Content-Type:`, req.headers.get('content-type'));
    console.log(`📦 [upload-audio-from-n8n-${requestId}] Content-Length:`, req.headers.get('content-length'));

    // Parse FormData avec timeout
    console.log(`📥 [upload-audio-from-n8n-${requestId}] Parsing FormData...`);
    const parseTimeout = setTimeout(() => {
      throw new Error('Timeout lors du parsing FormData (30s)');
    }, 30000);

    let formData;
    try {
      formData = await req.formData();
      clearTimeout(parseTimeout);
      console.log(`✅ [upload-audio-from-n8n-${requestId}] FormData parsé avec succès`);
    } catch (parseError) {
      clearTimeout(parseTimeout);
      console.error(`💥 [upload-audio-from-n8n-${requestId}] Erreur parsing FormData:`, parseError);
      throw new Error(`Erreur parsing FormData: ${parseError.message}`);
    }

    // Lire les données
    const webhookId = formData.get('requestId') as string;
    const storyId = formData.get('storyId') as string;
    const audioFile = formData.get('audioFile') as File;
    const voiceId = formData.get('voiceId') as string || '9BWtsMINqrJLrRacOk9x';
    const durationStr = formData.get('duration') as string;
    const duration = durationStr ? parseInt(durationStr) : null;

    // Validation Zod des champs texte
    const validationResult = UploadFormDataSchema.safeParse({
      requestId: webhookId,
      storyId: storyId,
      voiceId: voiceId,
      duration: duration || undefined
    });

    if (!validationResult.success) {
      console.error(`❌ [upload-audio-from-n8n-${requestId}] Validation échouée:`, validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Données invalides',
          details: validationResult.error.issues 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`📥 [upload-audio-from-n8n-${requestId}] FormData keys:`, Array.from(formData.keys()));
    console.log(`📥 [upload-audio-from-n8n-${requestId}] Données reçues:`, {
      webhookId: webhookId ? '✅' : '❌',
      storyId: storyId ? '✅' : '❌',
      audioFile: audioFile ? '✅' : '❌',
      audioFileName: audioFile?.name,
      audioFileSize: audioFile?.size,
      audioFileType: audioFile?.type,
      voiceId: voiceId ? '✅' : '❌',
      duration: duration ? duration : 'Non fourni'
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

    // Vérifier la taille du fichier (10MB max pour éviter les timeouts)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (audioFile.size > maxSize) {
      console.error(`❌ [upload-audio-from-n8n-${requestId}] Fichier trop volumineux: ${audioFile.size} bytes`);
      throw new Error(`Fichier trop volumineux: ${audioFile.size} bytes. Maximum autorisé: ${maxSize} bytes`);
    }

    console.log(`✅ [upload-audio-from-n8n-${requestId}] Validation du fichier réussie - Taille: ${audioFile.size} bytes`);

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

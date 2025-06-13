
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

serve(async (req) => {
  const requestId = crypto.randomUUID().slice(0, 8);
  console.log(`🔗 [n8n-webhook-${requestId}] NOUVELLE REQUÊTE ${req.method}`);

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
    const body = await req.json();
    console.log(`📥 [n8n-webhook-${requestId}] Données reçues:`, body);

    // Validation des données obligatoires
    const { 
      title, 
      content, 
      summary, 
      preview, 
      objective, 
      childrenNames,
      userId,
      childrenIds = [],
      status = 'completed',
      tags = [],
      isFavorite = false,
      sound_id = null,
      story_analysis = null
    } = body;

    if (!title || !content || !summary || !preview || !objective || !childrenNames || !userId) {
      throw new Error('Données obligatoires manquantes');
    }

    // Vérifier que l'utilisateur existe
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) {
      throw new Error(`Utilisateur ${userId} non trouvé`);
    }

    console.log(`👤 [n8n-webhook-${requestId}] Utilisateur validé: ${user.user.email}`);

    // Créer l'histoire en base avec l'analyse
    const { data: story, error: insertError } = await supabase
      .from('stories')
      .insert({
        title,
        content,
        summary,
        preview,
        status,
        objective,
        childrennames: childrenNames,
        childrenids: childrenIds,
        authorid: userId,
        sound_id,
        story_analysis,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error(`❌ [n8n-webhook-${requestId}] Erreur insertion:`, insertError);
      throw new Error(`Erreur création histoire: ${insertError.message}`);
    }

    console.log(`✅ [n8n-webhook-${requestId}] Histoire créée: ${story.id}`);
    if (story_analysis) {
      console.log(`📊 [n8n-webhook-${requestId}] Analyse incluse: ${Object.keys(story_analysis).join(', ')}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        storyId: story.id,
        message: 'Histoire créée avec succès via n8n',
        hasAnalysis: !!story_analysis,
        requestId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error(`💥 [n8n-webhook-${requestId}] ERREUR:`, error.message);

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

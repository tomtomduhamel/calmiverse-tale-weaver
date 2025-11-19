
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

// Validation schema
const StoryPayloadSchema = z.object({
  title: z.string().min(1, "Titre requis").max(200),
  content: z.string().min(100, "Contenu trop court").max(100000, "Contenu trop long"),
  summary: z.string().min(10, "Résumé trop court").max(1000),
  preview: z.string().min(10, "Preview trop court").max(500),
  objective: z.string().min(1, "Objectif requis"),
  childrenNames: z.array(z.string()).min(1, "Au moins un enfant requis"),
  userId: z.string().uuid("userId invalide"),
  childrenIds: z.array(z.string().uuid()).optional().default([]),
  status: z.enum(['pending', 'completed', 'error']).optional().default('completed'),
  tags: z.array(z.string()).optional().default([]),
  isFavorite: z.boolean().optional().default(false),
  sound_id: z.string().uuid().nullable().optional(),
  story_analysis: z.any().optional()
});

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
    // Vérification du secret webhook
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    
    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.error(`❌ [n8n-webhook-${requestId}] Secret webhook invalide ou manquant`);
      return new Response(
        JSON.stringify({ error: 'Authentification webhook invalide' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`✅ [n8n-webhook-${requestId}] Secret webhook validé`);

    // Initialiser le client Supabase avec la clé service
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Lire et valider le corps de la requête
    const body = await req.json();
    console.log(`📥 [n8n-webhook-${requestId}] Données reçues:`, body);

    const validationResult = StoryPayloadSchema.safeParse(body);
    if (!validationResult.success) {
      console.error(`❌ [n8n-webhook-${requestId}] Validation échouée:`, validationResult.error.issues);
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

    const { 
      title, 
      content, 
      summary, 
      preview, 
      objective, 
      childrenNames,
      userId,
      childrenIds,
      status,
      sound_id,
      story_analysis
    } = validationResult.data;

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

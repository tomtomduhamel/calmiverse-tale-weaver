import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";
import { corsHeaders } from "../_shared/cors-config.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Schéma de validation pour les données Kindle
const KindleDataSchema = z.object({
  storyId: z.string().uuid(),
  epubUrl: z.string().url(),
  epubFilename: z.string(),
});

// Schéma de validation pour la réponse n8n
const N8nResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📧 [send-to-kindle] Nouvelle requête d\'envoi Kindle');

  try {
    // Initialiser Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Configuration Supabase manquante");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ [send-to-kindle] Pas d\'en-tête Authorization');
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ [send-to-kindle] Erreur d\'authentification:', authError);
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ [send-to-kindle] Utilisateur authentifié:', user.id);

    // Parser et valider le body
    const body = await req.json();
    const validation = KindleDataSchema.safeParse(body);

    if (!validation.success) {
      console.error('❌ [send-to-kindle] Validation échouée:', validation.error);
      return new Response(
        JSON.stringify({ error: 'Données invalides', details: validation.error.issues }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { storyId, epubUrl, epubFilename } = validation.data;

    // Récupérer les données de l'histoire
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, title, content, authorid, childrennames, objective')
      .eq('id', storyId)
      .single();

    if (storyError || !story) {
      console.error('❌ [send-to-kindle] Histoire non trouvée:', storyError);
      return new Response(
        JSON.stringify({ error: 'Histoire non trouvée' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que l'utilisateur est bien l'auteur
    if (story.authorid !== user.id) {
      console.error('❌ [send-to-kindle] Utilisateur non autorisé pour cette histoire');
      return new Response(
        JSON.stringify({ error: 'Non autorisé pour cette histoire' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les données utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('firstname, lastname, kindle_email')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      console.error('❌ [send-to-kindle] Données utilisateur non trouvées:', userError);
      return new Response(
        JSON.stringify({ error: 'Données utilisateur non trouvées' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userData.kindle_email) {
      console.error('❌ [send-to-kindle] Email Kindle non configuré');
      return new Response(
        JSON.stringify({ error: 'Email Kindle non configuré' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les secrets
    const webhookUrl = Deno.env.get('N8N_KINDLE_WEBHOOK_URL');
    const webhookSecret = Deno.env.get('N8N_WEBHOOK_SECRET');

    if (!webhookUrl) {
      console.error('❌ [send-to-kindle] URL webhook Kindle non configurée');
      return new Response(
        JSON.stringify({ error: 'Configuration webhook manquante' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!webhookSecret) {
      console.error('❌ [send-to-kindle] Secret webhook non configuré');
      return new Response(
        JSON.stringify({ error: 'Configuration sécurité manquante' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gérer l'objectif qui peut être string ou objet
    const objectiveText = typeof story.objective === 'string' 
      ? story.objective 
      : (story.objective as any)?.name || (story.objective as any)?.value || '';

    // Préparer les données pour n8n
    const kindleData = {
      firstname: userData.firstname || "",
      lastname: userData.lastname || "",
      title: story.title,
      content: story.content,
      childrennames: story.childrennames || [],
      objective: objectiveText,
      kindleEmail: userData.kindle_email,
      epubUrl,
      epubFilename,
      storyId: story.id
    };

    console.log('📤 [send-to-kindle] Envoi vers n8n webhook avec secret');

    // Appeler le webhook n8n avec le secret dans le header
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhookSecret,
      },
      body: JSON.stringify(kindleData),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('❌ [send-to-kindle] Erreur webhook n8n:', n8nResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Erreur lors de l\'envoi vers Kindle',
          details: errorText 
        }), 
        { status: n8nResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const n8nData = await n8nResponse.json();
    console.log('✅ [send-to-kindle] Succès:', n8nData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Histoire envoyée vers Kindle avec succès',
        data: n8nData 
      }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 [send-to-kindle] Erreur serveur:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(
      JSON.stringify({ 
        error: 'Erreur serveur', 
        details: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

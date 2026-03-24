import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Récupère le template de prompt actif depuis la base de données
 */
async function fetchActivePromptTemplate(
  supabase: any,
  templateKey: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('v_active_prompt_templates')
      .select('active_content')
      .eq('key', templateKey)
      .single();

    if (error) {
      console.warn(`⚠️ Erreur récupération template ${templateKey}:`, error.message);
      return null;
    }

    return data?.active_content || null;
  } catch (err) {
    console.warn(`⚠️ Exception récupération template ${templateKey}:`, err);
    return null;
  }
}

/**
 * Remplace les variables {{variable}} dans un template
 */
function replacePromptVariables(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  if (!template) return "";

  let result = template;

  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, String(value));
    }
  });

  // Nettoyer les variables non remplacées
  result = result.replace(/\{\{[^}]+\}\}/g, "");

  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variables d'environnement Supabase manquantes");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const {
      storyId,
      previousStoryId,
      seriesId,
      tomeNumber,
      previousStoryContent,
      previousStorySummary,
      characters,
      writingStyle,
      recurringPhrases,
      narrativeStructure,
      childrenIds,
      childrenNames,
      objective,
      duration,
      sequelInstructions,
      userId,
      timestamp,
      webhookUrl
    } = await req.json();

    console.log('🔄 Création suite d\'histoire:', {
      storyId,
      previousStoryId,
      tomeNumber,
      userId,
      seriesIdFromPayload: seriesId
    });

    // 1. Vérifier que l'histoire existe et appartient à l'utilisateur
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .eq('authorid', userId)
      .single();

    if (storyError || !story) {
      throw new Error('Histoire non trouvée ou accès refusé');
    }

    // 2. Récupérer les données de l'histoire précédente pour analyse
    const { data: previousStory, error: prevError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', previousStoryId)
      .eq('authorid', userId)
      .single();

    if (prevError || !previousStory) {
      throw new Error('Histoire précédente non trouvée');
    }

    // 3. 🆕 Récupérer le template de prompt pour les suites depuis la DB
    console.log('📝 Récupération du template sequel_prompt_template...');
    const sequelPromptTemplate = await fetchActivePromptTemplate(supabase, 'sequel_prompt_template');

    // 🆕 Récupérer le template de prompt pour l'image
    console.log('📝 Récupération du template image_generation_prompt...');
    const imagePromptTemplate = await fetchActivePromptTemplate(supabase, 'image_generation_prompt');

    const promptSource = sequelPromptTemplate ? 'database' : 'fallback';
    console.log(`📝 Source du template: ${promptSource}`);

    // 4. Si template disponible, générer le prompt avec les variables
    let generatedSequelPrompt: string | null = null;
    if (sequelPromptTemplate) {
      const promptVariables = {
        previous_story_title: previousStory.title,
        previous_story_summary: previousStory.summary || previousStorySummary || '',
        previous_story_content: previousStory.content?.substring(0, 2000) || previousStoryContent?.substring(0, 2000) || '',
        characters: JSON.stringify(characters || previousStory.story_analysis?.characters || {}),
        tome_number: tomeNumber,
        children_names: (previousStory.childrennames || childrenNames || []).join(', '),
        objective: previousStory.objective || objective || 'fun',
        writing_style: writingStyle || '',
        recurring_phrases: Array.isArray(recurringPhrases) ? recurringPhrases.join(', ') : '',
        duration: duration || 10,
        estimated_word_count: duration ? Math.round(duration * 140) : 1400,
      };

      generatedSequelPrompt = replacePromptVariables(sequelPromptTemplate, promptVariables);
      console.log('✅ Prompt de suite généré depuis template DB');
    }

    // 5. Préparer le payload enrichi pour n8n
    // Source unique pour seriesId : DB prioritaire, fallback vers payload
    const resolvedSeriesId = story.series_id || seriesId;
    console.log('📦 Serie info:', {
      seriesIdFromPayload: seriesId,
      seriesIdFromDB: story.series_id,
      seriesIdUsed: resolvedSeriesId
    });

    const n8nPayload = {
      action: 'create_story_sequel',
      storyId: storyId,
      previousStoryId: previousStoryId,
      seriesId: resolvedSeriesId,
      tomeNumber: tomeNumber,

      // 🆕 Prompt généré depuis le template (si disponible)
      sequelPrompt: generatedSequelPrompt,
      sequelPromptTemplate: sequelPromptTemplate, // Template brut pour référence
      imagePromptTemplate: imagePromptTemplate, // 🆕 Template image brut
      promptSource: promptSource, // 'database' ou 'fallback'

      // Informations de l'histoire précédente depuis la base de données
      previousStoryInfo: {
        id: previousStory.id,
        title: previousStory.title,
        objective: previousStory.objective,
        content: previousStory.content,
        summary: previousStory.summary,
        storyAnalysis: previousStory.story_analysis || {},
        childrenNames: previousStory.childrennames || []
      },

      // Contexte narratif de l'histoire précédente (données fournies par l'utilisateur)
      previousContext: {
        content: previousStoryContent,
        summary: previousStorySummary,
        characters: characters || {},
        writingStyle: writingStyle,
        recurringPhrases: recurringPhrases || [],
        narrativeStructure: narrativeStructure || {}
      },

      // Contexte des enfants (inchangé)
      childrenContext: {
        childrenIds: childrenIds,
        childrenNames: childrenNames,
        objective: objective
      },

      // Configuration de la suite
      sequelConfiguration: {
        duration: duration || 10, // Durée en minutes (par défaut 10 min)
        estimatedWordCount: duration ? Math.round(duration * 140) : 1400 // 140 mots par minute en moyenne
      },

      // Instructions spéciales pour la suite
      sequelInstructions: sequelInstructions || {
        maintainCharacterConsistency: true,
        referenceToEvents: true,
        evolutionOfCharacters: true,
        newChallengesIntroduced: true
      },

      // Métadonnées
      userId: userId,
      authorid: story.authorid,
      timestamp: timestamp,
      locale: 'fr'
    };

    // 6. Déclencher le webhook n8n - priorité à l'URL fournie dans la requête
    const N8N_WEBHOOK_URL = webhookUrl || Deno.env.get('N8N_SEQUEL_WEBHOOK_URL');

    if (!N8N_WEBHOOK_URL) {
      console.warn('⚠️ URL webhook n8n non configurée, simulation du déclenchement');

      // Pour le développement, mettre à jour directement le statut
      await supabase
        .from('stories')
        .update({
          status: 'pending',
          preview: `Génération du tome ${tomeNumber} en cours...`
        })
        .eq('id', storyId);

      return new Response(
        JSON.stringify({
          success: true,
          storyId: storyId,
          promptSource: promptSource,
          message: 'Suite créée (mode développement)'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 7. Validation et appel du webhook n8n avec retry
    console.log('🔗 Appel webhook n8n:', N8N_WEBHOOK_URL);

    // Validation de l'URL du webhook
    if (!N8N_WEBHOOK_URL.startsWith('https://')) {
      throw new Error('URL webhook invalide: doit commencer par https://');
    }

    let lastError = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentative ${attempt}/${maxRetries} d'appel webhook`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Calmi-Webhook-Secret': Deno.env.get('N8N_WEBHOOK_SECRET') || ''
          },
          body: JSON.stringify(n8nPayload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log(`📡 Réponse webhook - Status: ${n8nResponse.status}`);

        if (!n8nResponse.ok) {
          const responseText = await n8nResponse.text();
          console.error(`❌ Erreur webhook n8n (${n8nResponse.status}):`, responseText);

          // Erreurs permanentes - pas de retry
          if (n8nResponse.status === 404 || n8nResponse.status === 400) {
            throw new Error(`Webhook inaccessible (${n8nResponse.status}): ${responseText || 'Vérifiez la configuration n8n'}`);
          }

          // Erreurs temporaires - retry possible
          lastError = new Error(`Erreur temporaire webhook (${n8nResponse.status}): ${responseText}`);

          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`⏳ Nouvelle tentative dans ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          throw lastError;
        }

        console.log('✅ Webhook n8n appelé avec succès');
        break;

      } catch (error: any) {
        lastError = error;

        if (error.name === 'AbortError') {
          lastError = new Error('Timeout: le webhook n8n ne répond pas dans les temps');
        }

        console.error(`❌ Erreur tentative ${attempt}:`, error.message);

        if (attempt === maxRetries || error.message.includes('inaccessible')) {
          throw lastError;
        }

        // Retry avec délai exponentiel
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Nouvelle tentative dans ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log('✅ Webhook n8n appelé avec succès. Fin de la fonction (la suite est gérée par n8n).');

    // Mettre à jour le statut avec une prévisualisation informative, MAIS SANS écraser si n8n a déjà répondu rapidement
    // On ne touche plus au statut ici pour éviter la race condition si n8n a déjà mis à jour vers "generating" ou "completed"
    // Cependant, si n8n est lent, l'histoire reste en "pending" grâce au front (useStorySeries)

    // Optionnel : on peut mettre un log dans la DB si besoin, mais on évite de toucher à 'status'

    return new Response(
      JSON.stringify({
        success: true,
        storyId: storyId,
        promptSource: promptSource,
        message: `Tome ${tomeNumber} initialisé avec succès`
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error: any) {
    console.error('❌ Erreur création suite:', error);

    // Tentative de mise à jour du statut en erreur pour que l'UI sache s'arrêter
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { storyId } = await req.json().catch(() => ({ storyId: null }));
        if (storyId) {
          await supabase.from('stories').update({
            status: 'error',
            error: error.message || 'Erreur inconnue lors de l\'initialisation'
          }).eq('id', storyId);
        }
      }
    } catch (e) {
      console.error('Impossible de mettre à jour le statut erreur en DB', e);
    }

    return new Response(
      JSON.stringify({
        error: error.message || 'Erreur interne du serveur',
        success: false
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
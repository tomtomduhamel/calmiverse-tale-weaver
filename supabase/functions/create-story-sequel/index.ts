import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.5";

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
      userId 
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

    // 3. Préparer le payload enrichi pour n8n
    const n8nPayload = {
      action: 'create_story_sequel',
      storyId: storyId,
      previousStoryId: previousStoryId,
      seriesId: seriesId,
      tomeNumber: tomeNumber,
      
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
      seriesId: story.series_id,
      timestamp: timestamp,
      locale: 'fr'
    };

    // 4. Déclencher le webhook n8n - priorité à l'URL fournie dans la requête
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

    // 5. Validation et appel du webhook n8n avec retry
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

    console.log('✅ Webhook n8n appelé avec succès');

    // 6. Mettre à jour le statut de l'histoire
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
        message: `Tome ${tomeNumber} en cours de génération`
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
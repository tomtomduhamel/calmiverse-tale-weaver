
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, initializeSupabase } from "../_shared/story-utils.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema
const CompletionCallbackSchema = z.object({
  storyId: z.string().uuid("storyId invalide"),
  userId: z.string().uuid("userId invalide"),
  status: z.string().min(1, "Status requis"),
  title: z.string().optional(),
  timestamp: z.string().optional()
});

serve(async (req) => {
  console.log(`[n8n-story-completion-callback] ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Vérification du secret webhook
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('N8N_WEBHOOK_SECRET');
    
    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.error(`[n8n-story-completion-callback] Secret webhook invalide ou manquant`);
      return new Response(
        JSON.stringify({ error: 'Authentification webhook invalide' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`[n8n-story-completion-callback] Secret webhook validé`);

    const supabase = initializeSupabase();
    
    const body = await req.json();
    console.log('[n8n-story-completion-callback] Received callback:', body);

    // Validation Zod
    const validationResult = CompletionCallbackSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('[n8n-story-completion-callback] Validation échouée:', validationResult.error.issues);
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

    const { storyId, userId, status, title, timestamp } = validationResult.data;

    // Vérifier que l'histoire existe et appartient à l'utilisateur
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, authorid, title, status')
      .eq('id', storyId)
      .eq('authorid', userId)
      .single();

    if (storyError || !story) {
      console.error('[n8n-story-completion-callback] Story not found or access denied:', storyError);
      return new Response(
        JSON.stringify({ error: 'Story not found or access denied' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('[n8n-story-completion-callback] Story found:', story);

    // Mettre à jour le statut de l'histoire si nécessaire
    if (story.status !== 'completed' && status === 'completed') {
      const { error: updateError } = await supabase
        .from('stories')
        .update({ 
          status: 'completed',
          updatedat: new Date().toISOString()
        })
        .eq('id', storyId);

      if (updateError) {
        console.error('[n8n-story-completion-callback] Failed to update story status:', updateError);
      } else {
        console.log('[n8n-story-completion-callback] Story status updated to completed');
      }
    }

    // Envoyer une notification Realtime au client spécifique
    const channelName = `story_completion_${userId}`;
    const payload = {
      type: 'story_completed',
      storyId,
      userId,
      status,
      title: title || story.title,
      timestamp: timestamp || new Date().toISOString(),
      source: 'n8n_callback'
    };

    console.log(`[n8n-story-completion-callback] Sending Realtime notification to channel: ${channelName}`, payload);

    // Utiliser Supabase Realtime pour notifier le client
    const channel = supabase.channel(channelName);
    await channel.send({
      type: 'broadcast',
      event: 'story_completion',
      payload
    });

    // Également essayer via la table stories pour déclencher les triggers Realtime
    await supabase
      .from('stories')
      .update({ 
        updatedat: new Date().toISOString() 
      })
      .eq('id', storyId);

    console.log('[n8n-story-completion-callback] Callback processed successfully');

    // 🚀 ÉVALUATION SYSTÉMATIQUE EN ARRIÈRE-PLAN (100% asynchrone post-livraison)
    // Ne retarde jamais la livraison de l'histoire à l'utilisateur
    if (status === 'completed' && story) {
      const backgroundTask = triggerBackgroundCritique(supabase, story, userId);
      if (typeof (globalThis as any).EdgeRuntime !== 'undefined' && typeof (globalThis as any).EdgeRuntime.waitUntil === 'function') {
        (globalThis as any).EdgeRuntime.waitUntil(backgroundTask);
      } else {
        backgroundTask.catch((err) => {
          console.error('[n8n-story-completion-callback] Background critique error:', err);
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Story completion callback processed',
        storyId,
        channelUsed: channelName
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[n8n-story-completion-callback] Error processing callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Exécute l'analyse critique littéraire n8n en arrière-plan et enregistre le résultat dans story_critiques
 */
async function triggerBackgroundCritique(supabase: any, story: any, userId: string) {
  try {
    // Si le contenu n'était pas dans le premier select, le recharger
    let content = story.content;
    let title = story.title;
    let objective = story.objective;
    let targetAge = "4-6 ans";

    if (!content || content.trim().length < 20) {
      const { data: freshStory } = await supabase
        .from('stories')
        .select('title, content, objective, childrenids')
        .eq('id', story.id)
        .single();

      if (freshStory) {
        content = freshStory.content;
        title = freshStory.title || title;
        objective = freshStory.objective || objective;

        // Détection de l'âge cible si un profil enfant est lié
        if (freshStory.childrenids && freshStory.childrenids.length > 0) {
          const { data: child } = await supabase
            .from('children')
            .select('birthdate')
            .eq('id', freshStory.childrenids[0])
            .single();

          if (child?.birthdate) {
            const age = Math.floor((Date.now() - new Date(child.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            if (age <= 2) targetAge = "0-2 ans";
            else if (age <= 4) targetAge = "2-4 ans";
            else if (age <= 7) targetAge = "4-6 ans";
            else if (age <= 12) targetAge = "8-12 ans";
            else targetAge = "13+ ans";
          }
        }
      }
    }

    if (!content || content.trim().length < 20) {
      console.log(`[n8n-story-completion-callback] Skipping critique for ${story.id}: content too short or missing`);
      return;
    }

    // Vérifier si une critique existe déjà pour éviter les doublons
    const { data: existing } = await supabase
      .from('story_critiques')
      .select('id')
      .eq('story_id', story.id)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`[n8n-story-completion-callback] Critique already exists for story ${story.id}`);
      return;
    }

    console.log(`[n8n-story-completion-callback] 🚀 Background critique starting for story ${story.id} (« ${title} »)...`);

    const n8nWebhook = Deno.env.get('N8N_CRITIQUE_WEBHOOK_URL') || 'https://n8n.srv856374.hstgr.cloud/webhook/critique-histoire';

    const payload = {
      title: title || "Histoire sans titre",
      content: content.trim(),
      targetAge,
      objective: objective || "sleep",
      targetWordCount: 300,
      storyId: story.id,
      userId: userId
    };

    const res = await fetch(n8nWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[n8n-story-completion-callback] Critique webhook HTTP ${res.status}: ${errText}`);
      return;
    }

    const data = await res.json();
    if (!data.success || !data.critique) {
      console.warn(`[n8n-story-completion-callback] Critique response invalid:`, data.message || data);
      return;
    }

    const critiqueData = data.critique;
    const meta = data.storyMeta || {};

    const critiqueRecord = {
      story_id: story.id,
      title: payload.title,
      content: payload.content,
      target_age: payload.targetAge,
      objective: payload.objective,
      target_word_count: payload.targetWordCount,
      actual_word_count: meta.actualWordCount || payload.content.split(/\s+/).filter(Boolean).length,
      overall_score: critiqueData.overall_score || data.score || 5.0,
      badge: data.badge || "🟡 PASSABLE",
      verdict: critiqueData.verdict_punchline || data.verdict || "Analyse complétée",
      detailed_scores: critiqueData.detailed_scores || {},
      critique_summary: critiqueData.critique_summary || {},
      strengths: critiqueData.strengths || [],
      weaknesses: critiqueData.weaknesses || [],
      calmi_pitfalls: critiqueData.calmi_pitfalls_analysis || {},
      actionable_improvements: critiqueData.actionable_improvements || [],
      rewrite_demonstration: critiqueData.rewrite_demonstration || {},
      stats: meta,
      markdown_report: data.markdownReport || "",
      evaluator_model: "gpt-4o"
    };

    const { error: insertError } = await supabase
      .from('story_critiques')
      .insert(critiqueRecord);

    if (insertError) {
      console.error('[n8n-story-completion-callback] Failed to insert critique into story_critiques:', insertError.message);
    } else {
      console.log(`[n8n-story-completion-callback] ✅ Systematic critique recorded for story ${story.id} (Score: ${critiqueRecord.overall_score}/10)`);
    }
  } catch (err) {
    console.error('[n8n-story-completion-callback] Error during background critique execution:', err);
  }
}


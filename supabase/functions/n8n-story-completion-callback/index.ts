
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, initializeSupabase } from "../_shared/story-utils.ts";

serve(async (req) => {
  console.log(`[n8n-story-completion-callback] ${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = initializeSupabase();
    
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body = await req.json();
    console.log('[n8n-story-completion-callback] Received callback:', body);

    const { storyId, userId, status, title, timestamp } = body;

    // Validation des données requises
    if (!storyId || !userId || !status) {
      console.error('[n8n-story-completion-callback] Missing required fields:', { storyId, userId, status });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: storyId, userId, status' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

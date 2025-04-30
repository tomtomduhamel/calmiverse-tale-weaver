
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { storyId, objective, childrenNames } = await req.json()

    if (!storyId || !objective || !childrenNames || !childrenNames.length) {
      throw new Error('Paramètres manquants: storyId, objective, et childrenNames sont requis')
    }

    // TODO: Intégration avec OpenAI ou autre service de génération
    // Pour l'instant, nous allons simplement simuler la génération

    // Simuler un délai pour la génération
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Générer un conte simple
    const childrenString = childrenNames.join(' et ')
    const title = `L'aventure de ${childrenString}`
    const content = `Il était une fois ${childrenString} qui ${objective.toLowerCase()}. 
                    Après beaucoup d'efforts et de péripéties, ils ont réussi et sont rentrés chez eux 
                    heureux et enrichis par cette expérience.`
    const summary = `Une histoire où ${childrenString} ${objective.toLowerCase()}`
    const preview = `${childrenString} partent à l'aventure...`
    
    // Mettre à jour l'histoire dans la base de données
    const supabaseClient = await createSupabaseClient()
    const { error } = await supabaseClient
      .from('stories')
      .update({
        title,
        content,
        summary,
        preview,
        status: 'completed',
        updatedat: new Date().toISOString()
      })
      .eq('id', storyId)
    
    if (error) throw error
    
    console.log('Histoire générée avec succès:', { storyId, title })

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Histoire générée avec succès'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  } catch (error) {
    console.error('Erreur lors de la génération de l\'histoire:', error)
    
    // Mettre à jour le statut de l'histoire en cas d'erreur
    try {
      const { storyId } = await req.json()
      if (storyId) {
        const supabaseClient = await createSupabaseClient()
        await supabaseClient
          .from('stories')
          .update({
            status: 'error',
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            updatedat: new Date().toISOString()
          })
          .eq('id', storyId)
      }
    } catch (e) {
      console.error('Erreur lors de la mise à jour du statut de l\'histoire:', e)
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})

// Fonction helper pour créer un client Supabase
async function createSupabaseClient() {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.38.5")
  
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

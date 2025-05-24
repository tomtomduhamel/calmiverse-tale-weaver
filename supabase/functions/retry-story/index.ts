
// Importer les modules nécessaires
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/story-utils.ts";
import { initializeSupabase } from "../_shared/story-utils.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    console.log('🔄 Fonction retry-story appelée');
    
    // Analyse du corps de la requête
    const { storyId } = await req.json();
    
    if (!storyId) {
      throw new Error("L'ID de l'histoire est requis");
    }
    
    console.log(`📝 Tentative de relance pour l'histoire: ${storyId}`);
    
    // Initialisation du client Supabase
    const supabase = initializeSupabase();
    
    // Récupérer les détails de l'histoire pour obtenir l'objectif et les noms des enfants
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();
      
    if (storyError) {
      console.error('❌ Erreur lors de la récupération des détails de l\'histoire:', storyError);
      throw new Error(`Erreur lors de la récupération des détails de l'histoire: ${storyError.message}`);
    }
    
    console.log('📖 Détails de l\'histoire récupérés:', { 
      id: story.id, 
      objective: story.objective, 
      childrenNames: story.childrennames 
    });
    
    // Mettre à jour le statut de l'histoire à "pending"
    const { error: updateError } = await supabase
      .from('stories')
      .update({
        status: 'pending',
        updatedat: new Date().toISOString(),
        error: null // Supprimer l'erreur précédente
      })
      .eq('id', storyId);
      
    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour du statut:', updateError);
      throw new Error(`Erreur lors de la mise à jour du statut de l'histoire: ${updateError.message}`);
    }
    
    console.log('✅ Statut mis à jour vers "pending"');
    
    // Appeler directement la fonction generateStory avec les bonnes données
    const { data: generateData, error: generateError } = await supabase.functions.invoke('generateStory', {
      body: {
        storyId: storyId,
        objective: story.objective,
        childrenNames: story.childrennames
      }
    });
    
    if (generateError) {
      console.error('❌ Erreur lors de l\'appel à generateStory:', generateError);
      
      // Mettre à jour le statut à "error"
      await supabase
        .from('stories')
        .update({
          status: 'error',
          updatedat: new Date().toISOString(),
          error: generateError.message || 'Erreur lors de la génération'
        })
        .eq('id', storyId);
        
      throw generateError;
    }
    
    console.log('🎉 Histoire relancée avec succès:', generateData);
    
    // La réponse indique que la requête a été traitée avec succès
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Génération de l'histoire relancée avec succès",
        data: generateData 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    // Gestion des erreurs
    console.error("❌ Erreur dans retry-story:", error.message);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erreur inconnue lors de la relance' 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

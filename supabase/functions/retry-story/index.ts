
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
    // Analyse du corps de la requête
    const { storyId } = await req.json();
    
    if (!storyId) {
      throw new Error("L'ID de l'histoire est requis");
    }
    
    // Initialisation du client Supabase
    const supabase = initializeSupabase();
    
    // Mettre à jour le statut de l'histoire
    const { error: updateError } = await supabase
      .from('stories')
      .update({
        status: 'pending',
        updatedat: new Date().toISOString(),
        error: null // Supprimer l'erreur précédente
      })
      .eq('id', storyId);
      
    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour du statut de l'histoire: ${updateError.message}`);
    }
    
    // Récupérer les détails de l'histoire
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single();
      
    if (storyError) {
      throw new Error(`Erreur lors de la récupération des détails de l'histoire: ${storyError.message}`);
    }
    
    // Sélectionner un fond sonore adapté au contenu de l'histoire (logique simplifiée)
    // Pour l'instant, nous sélectionnons un fond sonore aléatoire
    const { data: availableSounds, error: soundsError } = await supabase
      .from('sound_backgrounds')
      .select('id');
      
    if (soundsError) {
      console.error("Erreur lors de la récupération des fonds sonores:", soundsError);
      // Continuer sans fond sonore
    }
    
    // Attribuer un fond sonore si disponible
    if (availableSounds && availableSounds.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableSounds.length);
      const selectedSoundId = availableSounds[randomIndex].id;
      
      await supabase
        .from('stories')
        .update({
          sound_id: selectedSoundId
        })
        .eq('id', storyId);
    }
    
    // La réponse indique que la requête a été traitée avec succès
    return new Response(
      JSON.stringify({ success: true, message: "Génération de l'histoire relancée" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    // Gestion des erreurs
    console.error("Erreur:", error.message);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

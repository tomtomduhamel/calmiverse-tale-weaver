
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders, 
  initializeOpenAI, 
  initializeSupabase,
  validateInput,
  generateStoryText,
  generateSummary,
  generateTitle,
  updateStoryInDb,
  checkStoryExists,
  fetchStoryDataFromDb
} from "../_shared/story-utils.ts";

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Récupérer les données de la requête
    const requestBody = await req.json().catch(error => {
      console.error("Erreur lors de la lecture du corps de la requête:", error);
      throw new Error("Format de requête invalide");
    });
    
    console.log("Requête reçue pour la génération d'histoire:", requestBody);
    
    // Extraire le storyId qui est obligatoire
    const { storyId } = requestBody;
    if (!storyId) {
      throw new Error("ID d'histoire manquant dans la requête");
    }
    
    // Extraire les paramètres optionnels
    let { objective, childrenNames } = requestBody;

    // Initialiser le client Supabase
    const supabase = initializeSupabase();
    
    // Vérifier si l'histoire existe et récupérer ses données de base
    const storyData = await checkStoryExists(supabase, storyId);
    
    // Si les paramètres objective ou childrenNames sont manquants, les récupérer depuis la base de données
    if (!objective || !childrenNames || childrenNames.length === 0) {
      console.log("Paramètres manquants, récupération depuis la base de données...");
      
      const storyDetails = await fetchStoryDataFromDb(supabase, storyId);
      
      objective = objective || storyDetails.objective;
      childrenNames = childrenNames || storyDetails.childrennames;
      
      console.log("Données récupérées depuis la base de données:", { 
        objective, 
        childrenNames,
        status: storyDetails.status
      });
      
      // Si l'histoire a déjà été complétée, retourner les données existantes
      if (storyDetails.status === 'completed') {
        console.log(`L'histoire ${storyId} est déjà complétée, retour des données existantes`);
        return new Response(
          JSON.stringify({
            success: true,
            message: "Histoire déjà générée",
            storyData: {
              title: storyDetails.title,
              content: storyDetails.content,
              summary: storyDetails.summary,
              preview: storyDetails.preview,
              status: 'completed'
            }
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }

    // Validation des données d'entrée avec les données récupérées
    try {
      validateInput(storyId, objective, childrenNames);
    } catch (validationError) {
      console.error("Validation échouée:", validationError.message);
      
      // Mettre à jour le statut d'erreur de l'histoire
      await updateStoryInDb(supabase, storyId, {
        status: 'error',
        error: validationError.message || 'Erreur de validation des données'
      });
      
      return new Response(
        JSON.stringify({
          error: true,
          message: validationError.message
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Génération d'histoire pour: ID=${storyId}, objectif=${objective}, enfants=${childrenNames.join(', ')}`);
    
    // Mettre à jour le statut à "pending" avant de commencer
    await updateStoryInDb(supabase, storyId, {
      title: `Histoire en cours de création pour ${childrenNames.join(' et ')}`,
      content: '',
      summary: 'Génération en cours...',
      preview: 'Histoire en cours de création...',
      status: 'pending',
      error: null
    });
    
    // Obtenir la clé API OpenAI
    const openAIApiKey = initializeOpenAI();
    
    try {
      console.log("Début de la génération du texte de l'histoire...");
      
      // Générer le texte principal de l'histoire
      const storyText = await generateStoryText(openAIApiKey, objective, childrenNames);
      console.log(`Texte généré avec succès (${storyText.length} caractères)`);
      
      // Générer le résumé de l'histoire
      console.log("Génération du résumé...");
      const summary = await generateSummary(openAIApiKey, storyText);
      
      // Générer un titre pour l'histoire
      console.log("Génération du titre...");
      const title = await generateTitle(openAIApiKey, storyText, childrenNames);
      
      // Créer un extrait (preview) à partir du début de l'histoire
      const preview = storyText.substring(0, 200) + "...";
      
      // Recherche d'un fond sonore adapté à l'objectif de l'histoire
      let sound_id = null;
      try {
        console.log(`🔍 Recherche d'un fond sonore adapté pour l'objectif: ${objective}`);
        
        // Récupérer un son correspondant à l'objectif
        const { data: sounds, error: soundError } = await supabase
          .from('sound_backgrounds')
          .select('id, title, file_path')
          .eq('objective', objective);
        
        if (soundError) {
          console.error("❌ Erreur lors de la recherche de sons:", soundError);
        } else if (sounds && sounds.length > 0) {
          // Vérifier que chaque son a un fichier valide
          const validSounds = sounds.filter(sound => sound.file_path);
          
          if (validSounds.length > 0) {
            // Choisir un son aléatoirement parmi ceux valides
            const randomIndex = Math.floor(Math.random() * validSounds.length);
            sound_id = validSounds[randomIndex].id;
            console.log(`✅ Fond sonore sélectionné pour l'histoire: 
              ID: ${sound_id}, 
              Titre: ${validSounds[randomIndex].title}, 
              Fichier: ${validSounds[randomIndex].file_path}`
            );
          } else {
            console.log(`⚠️ Aucun son avec fichier valide trouvé pour l'objectif: ${objective}`);
          }
        } else {
          console.log(`⚠️ Aucun fond sonore trouvé pour l'objectif: ${objective}`);
        }
      } catch (soundError) {
        console.error("❌ Erreur lors de la sélection du son:", soundError);
      }
      
      // Mettre à jour l'histoire dans la base de données
      await updateStoryInDb(supabase, storyId, {
        title,
        content: storyText,
        summary,
        preview,
        sound_id, // Associer le son sélectionné à l'histoire
        status: 'completed',
        error: null
      });

      console.log(`✅ Histoire générée avec succès: ID=${storyId}, titre=${title}, son=${sound_id}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          storyData: {
            title,
            content: storyText,
            summary,
            preview,
            sound_id
          }
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error("❌ Erreur lors de la génération:", error.message, error.stack);
      
      // Mettre à jour le statut d'erreur de l'histoire
      await updateStoryInDb(supabase, storyId, {
        status: 'error',
        error: error.message || 'Erreur inconnue lors de la génération'
      });
        
      throw error;
    }
  } catch (error: any) {
    console.error("❌ Erreur globale:", error.message, error.stack);

    return new Response(
      JSON.stringify({
        error: true,
        message: error.message || "Une erreur est survenue lors de la génération de l'histoire",
        details: error.stack ? error.stack.split("\n").slice(0, 3).join(" → ") : "Pas de détails"
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


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook pour charger les détails d'un son à partir de son ID ou trouver un son adapté à un objectif
 */
export const useSoundDetails = (soundId?: string | null, storyObjective?: string | null) => {
  const [soundDetails, setSoundDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Charger les détails du son
  useEffect(() => {
    const loadSoundDetails = async () => {
      setError(null);
      
      // Log pour débogage - infos initiales
      console.log("🔊 useSoundDetails - Initialisation avec:", { 
        soundId, 
        storyObjective
      });
      
      // Si nous n'avons pas de soundId mais un objectif, essayons de trouver un son adapté
      let soundToLoad = soundId;
      
      if (!soundToLoad && storyObjective) {
        try {
          setIsLoading(true);
          console.log(`🔊 Recherche d'un son pour l'objectif: ${storyObjective}`);
          
          // Rechercher un son correspondant à l'objectif
          const { data: matchingSounds, error: matchingError } = await supabase
            .from('sound_backgrounds')
            .select('id, title, file_path')
            .eq('objective', storyObjective)
            .order('created_at', { ascending: false });
            
          if (matchingError) {
            console.error("❌ Erreur lors de la recherche de sons par objectif:", matchingError);
            setError(`Erreur de recherche: ${matchingError.message}`);
          } else if (matchingSounds && matchingSounds.length > 0) {
            // Choisir un son aléatoire parmi ceux qui correspondent
            const randomIndex = Math.floor(Math.random() * matchingSounds.length);
            soundToLoad = matchingSounds[randomIndex].id;
            console.log(`✅ Son automatiquement sélectionné pour l'objectif ${storyObjective}:`, {
              id: soundToLoad,
              title: matchingSounds[randomIndex].title,
              filePath: matchingSounds[randomIndex].file_path
            });
          } else {
            console.warn(`⚠️ Aucun son trouvé pour l'objectif: ${storyObjective}`);
            setError(`Aucun son disponible pour l'objectif: ${storyObjective}`);
          }
        } catch (e) {
          console.error("❌ Erreur lors de la sélection du son par objectif:", e);
          setError(`Erreur lors de la sélection: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      
      if (!soundToLoad) {
        console.log("ℹ️ Aucun son à charger (ID manquant et objectif non trouvé)");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log(`🔄 Chargement des détails pour le son ID: ${soundToLoad}`);
        
        const { data, error } = await supabase
          .from('sound_backgrounds')
          .select('*')
          .eq('id', soundToLoad)
          .single();
          
        if (error) {
          console.error(`❌ Erreur lors de la récupération des détails du son ID ${soundToLoad}:`, error);
          setError(`Erreur de récupération: ${error.message}`);
          throw error;
        }
        
        if (!data) {
          console.error(`❌ Aucun son trouvé avec l'ID: ${soundToLoad}`);
          setError(`Son non trouvé: ID ${soundToLoad}`);
          setIsLoading(false);
          return;
        }
        
        console.log("✅ Détails du son récupérés:", data);
        setSoundDetails(data);
        
        // Vérifier si le son a un chemin de fichier valide
        if (!data.file_path) {
          console.error(`❌ Le son ID ${soundToLoad} n'a pas de chemin de fichier valide`);
          setError(`Chemin de fichier manquant pour le son ID: ${soundToLoad}`);
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error('❌ Erreur de chargement du son:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les détails du fond sonore',
          variant: 'destructive',
        });
        setError(`Erreur de chargement: ${error.message || 'Erreur inconnue'}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadSoundDetails();
    
  }, [soundId, storyObjective, toast]);

  return {
    soundDetails,
    isLoading,
    error,
  };
};

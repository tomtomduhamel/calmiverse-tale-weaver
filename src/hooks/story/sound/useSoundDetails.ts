
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook pour charger les détails d'un son avec gestion améliorée des erreurs
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
      console.log("🔊 useSoundDetails - Début du chargement:", { 
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
            .select('id, title, file_path, objective')
            .eq('objective', storyObjective)
            .not('file_path', 'is', null)
            .order('created_at', { ascending: false });
            
          if (matchingError) {
            console.error("❌ Erreur lors de la recherche de sons par objectif:", matchingError);
            setError(`Erreur de recherche: ${matchingError.message}`);
            setIsLoading(false);
            return;
          }
          
          if (matchingSounds && matchingSounds.length > 0) {
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
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error("❌ Erreur lors de la sélection du son par objectif:", e);
          setError(`Erreur lors de la sélection: ${e instanceof Error ? e.message : String(e)}`);
          setIsLoading(false);
          return;
        }
      }
      
      if (!soundToLoad) {
        console.log("ℹ️ Aucun son à charger (ID manquant et objectif non trouvé)");
        setIsLoading(false);
        setSoundDetails(null);
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
          setError(`Son non trouvé: ${error.message}`);
          setIsLoading(false);
          return;
        }
        
        if (!data) {
          console.error(`❌ Aucun son trouvé avec l'ID: ${soundToLoad}`);
          setError(`Son non trouvé: ID ${soundToLoad}`);
          setIsLoading(false);
          return;
        }
        
        // Vérifier si le son a un chemin de fichier valide
        if (!data.file_path) {
          console.error(`❌ Le son ID ${soundToLoad} n'a pas de chemin de fichier valide`);
          setError(`Fichier audio manquant pour: ${data.title || 'Son sans titre'}`);
          setIsLoading(false);
          return;
        }
        
        console.log("✅ Détails du son récupérés avec succès:", {
          id: data.id,
          title: data.title,
          file_path: data.file_path,
          objective: data.objective
        });
        
        setSoundDetails(data);
        setError(null);
        
      } catch (error: any) {
        console.error('❌ Erreur de chargement du son:', error);
        const errorMessage = `Erreur de chargement: ${error.message || 'Erreur inconnue'}`;
        setError(errorMessage);
        
        toast({
          title: 'Erreur de fond sonore',
          description: 'Impossible de charger le fond sonore pour cette histoire',
          variant: 'destructive',
        });
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

export default useSoundDetails;

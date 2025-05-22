
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/settings/useUserSettings';

interface BackgroundSoundProps {
  soundId?: string | null;
  storyObjective?: string | null;
  autoPlay?: boolean;
}

export const useBackgroundSound = ({ 
  soundId, 
  storyObjective,
  autoPlay = false 
}: BackgroundSoundProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [soundDetails, setSoundDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { userSettings } = useUserSettings();

  // Vérifier si la lecture de musique est activée dans les préférences
  const musicEnabled = userSettings?.readingPreferences?.backgroundMusicEnabled ?? true;

  // Charger les détails du son
  useEffect(() => {
    const loadSoundDetails = async () => {
      if (!musicEnabled) return;
      
      setError(null);
      
      // Log pour débogage - infos initiales
      console.log("🔊 useBackgroundSound - Initialisation avec:", { 
        soundId, 
        storyObjective, 
        autoPlay, 
        musicEnabled 
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
          return;
        }
        
        // Précharger l'audio
        console.log(`🔄 Préchargement du fichier audio: ${data.file_path}`);
        const { data: publicUrl } = supabase.storage
          .from('story_sounds')
          .getPublicUrl(data.file_path);
          
        if (!publicUrl || !publicUrl.publicUrl) {
          console.error(`❌ Impossible d'obtenir l'URL publique pour: ${data.file_path}`);
          setError(`URL inaccessible: ${data.file_path}`);
          setIsLoading(false);
          return;
        }
        
        console.log(`✅ URL audio obtenue: ${publicUrl.publicUrl}`);
        
        // Créer l'élément audio si nécessaire
        if (!audioRef.current) {
          audioRef.current = new Audio(publicUrl.publicUrl);
          audioRef.current.loop = true;  // Lecture en boucle
          audioRef.current.volume = 0.5; // Volume à 50%
          
          // Ajouter des écouteurs d'événements pour le débogage
          audioRef.current.addEventListener('canplaythrough', () => {
            console.log('✅ Audio prêt à être lu entièrement sans mise en mémoire tampon.');
          });
          
          audioRef.current.addEventListener('error', (e) => {
            const error = e.currentTarget as HTMLAudioElement;
            console.error('❌ Erreur de lecture audio:', error.error);
            setError(`Erreur de lecture: ${error.error ? error.error.message : 'Erreur inconnue'}`);
            setIsLoading(false);
          });
        } else {
          audioRef.current.src = publicUrl.publicUrl;
        }
        
        // Démarrer la lecture automatiquement si requis
        if (autoPlay) {
          console.log('🔄 Tentative de lecture automatique...');
          audioRef.current.play()
            .then(() => {
              console.log('✅ Lecture automatique démarrée');
              setIsPlaying(true);
            })
            .catch(err => {
              console.error('❌ Erreur de lecture automatique:', err);
              setError(`Erreur lecture auto: ${err.message}`);
            });
        }
      } catch (error: any) {
        console.error('❌ Erreur de chargement du son:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le fond sonore',
          variant: 'destructive',
        });
        setError(`Erreur de chargement: ${error.message || 'Erreur inconnue'}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadSoundDetails();
    
    // Nettoyer lors du démontage du composant
    return () => {
      console.log('🧹 Nettoyage du fond sonore');
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [soundId, storyObjective, autoPlay, musicEnabled, toast]);

  // Méthode pour basculer la lecture
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !musicEnabled) return;
    
    console.log(`🔄 Bascule de lecture - État actuel: ${isPlaying ? 'En lecture' : 'En pause'}`);
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      console.log('⏸️ Lecture mise en pause');
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          console.log('▶️ Lecture démarrée');
        })
        .catch(err => {
          console.error('❌ Erreur de lecture:', err);
          setError(`Erreur de lecture: ${err.message}`);
          toast({
            title: 'Erreur',
            description: 'Impossible de lire le fond sonore',
            variant: 'destructive',
          });
        });
    }
  }, [isPlaying, musicEnabled, toast]);

  // Méthode pour régler le volume
  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return;
    const safeVolume = Math.max(0, Math.min(1, volume));
    audioRef.current.volume = safeVolume;
    console.log(`🔊 Volume réglé à: ${safeVolume}`);
  }, []);

  // Arrêter la lecture
  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      console.log('⏹️ Lecture arrêtée');
    }
  }, []);

  return {
    isPlaying,
    isLoading,
    soundDetails,
    togglePlay,
    setVolume,
    stopSound,
    musicEnabled,
    error
  };
};

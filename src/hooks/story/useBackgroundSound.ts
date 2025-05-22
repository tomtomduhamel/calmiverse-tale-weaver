
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserSettings } from '@/hooks/settings/useUserSettings';

interface BackgroundSoundProps {
  soundId?: string | null;
  autoPlay?: boolean;
}

export const useBackgroundSound = ({ soundId, autoPlay = false }: BackgroundSoundProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [soundDetails, setSoundDetails] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { userSettings } = useUserSettings();

  // Vérifier si la lecture de musique est activée dans les préférences
  const musicEnabled = userSettings?.readingPreferences?.backgroundMusicEnabled ?? true;

  // Charger les détails du son
  useEffect(() => {
    const loadSoundDetails = async () => {
      if (!soundId || !musicEnabled) return;

      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('sound_backgrounds')
          .select('*')
          .eq('id', soundId)
          .single();
          
        if (error) throw error;
        
        setSoundDetails(data);
        
        // Précharger l'audio
        if (data.file_path) {
          const { data: publicUrl } = supabase.storage
            .from('story_sounds')
            .getPublicUrl(data.file_path);
            
          if (publicUrl) {
            // Créer l'élément audio si nécessaire
            if (!audioRef.current) {
              audioRef.current = new Audio(publicUrl.publicUrl);
              audioRef.current.loop = true;  // Lecture en boucle
              audioRef.current.volume = 0.5; // Volume à 50%
            } else {
              audioRef.current.src = publicUrl.publicUrl;
            }
            
            // Démarrer la lecture automatiquement si requis
            if (autoPlay) {
              audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(err => console.error('Erreur de lecture automatique:', err));
            }
          }
        }
      } catch (error: any) {
        console.error('Erreur de chargement du son:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le fond sonore',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSoundDetails();
    
    // Nettoyer lors du démontage du composant
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [soundId, autoPlay, musicEnabled, toast]);

  // Méthode pour basculer la lecture
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !musicEnabled) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error('Erreur de lecture:', err);
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
    audioRef.current.volume = Math.max(0, Math.min(1, volume)); // Entre 0 et 1
  }, []);

  // Arrêter la lecture
  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  return {
    isPlaying,
    isLoading,
    soundDetails,
    togglePlay,
    setVolume,
    stopSound,
    musicEnabled
  };
};


import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseSoundPlayerProps {
  soundDetails: any | null;
  autoPlay?: boolean;
  musicEnabled: boolean;
}

/**
 * Hook pour gérer la lecture d'un son
 */
export const useSoundPlayer = ({ 
  soundDetails, 
  autoPlay = false,
  musicEnabled
}: UseSoundPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Charger et configurer l'audio lorsque les détails du son sont disponibles
  useEffect(() => {
    const setupAudio = async () => {
      // Si la musique est désactivée ou pas de détails de son, ne rien faire
      if (!musicEnabled || !soundDetails || !soundDetails.file_path) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        return;
      }

      try {
        // Précharger l'audio
        console.log(`🔄 Préchargement du fichier audio: ${soundDetails.file_path}`);
        const { data: publicUrl } = supabase.storage
          .from('story_sounds')
          .getPublicUrl(soundDetails.file_path);
          
        if (!publicUrl || !publicUrl.publicUrl) {
          console.error(`❌ Impossible d'obtenir l'URL publique pour: ${soundDetails.file_path}`);
          setError(`URL inaccessible: ${soundDetails.file_path}`);
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
        console.error('❌ Erreur de configuration audio:', error);
        setError(`Erreur de configuration: ${error.message || 'Erreur inconnue'}`);
      }
    };

    setupAudio();
    
    // Nettoyer lors du démontage du composant
    return () => {
      console.log('🧹 Nettoyage du fond sonore');
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [soundDetails, autoPlay, musicEnabled]);

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
    togglePlay,
    setVolume,
    stopSound,
    error: error
  };
};

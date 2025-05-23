
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
      console.log("🔄 Configuration audio - musicEnabled:", musicEnabled, "soundDetails:", soundDetails?.file_path);
      
      // Si la musique est désactivée ou pas de détails de son, ne rien faire
      if (!musicEnabled || !soundDetails || !soundDetails.file_path) {
        console.log("🔄 Nettoyage audio - conditions non remplies");
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
          setIsPlaying(false);
        }
        return;
      }

      try {
        setError(null);
        
        // Précharger l'audio
        console.log(`🔄 Préchargement du fichier audio: ${soundDetails.file_path}`);
        
        // Obtenir l'URL publique du fichier
        const { data: publicUrl } = supabase.storage
          .from('story_sounds')
          .getPublicUrl(soundDetails.file_path);
          
        if (!publicUrl || !publicUrl.publicUrl) {
          const errorMsg = `Impossible d'obtenir l'URL publique pour: ${soundDetails.file_path}`;
          console.error(`❌ ${errorMsg}`);
          setError(errorMsg);
          return;
        }
        
        console.log(`✅ URL audio obtenue: ${publicUrl.publicUrl}`);
        
        // Créer ou réutiliser l'élément audio
        if (!audioRef.current) {
          console.log("🔄 Création d'un nouvel élément audio");
          audioRef.current = new Audio();
          audioRef.current.loop = true;  // Lecture en boucle
          audioRef.current.volume = 0.3; // Volume à 30% pour être moins intrusif
          audioRef.current.crossOrigin = "anonymous"; // Pour éviter les problèmes CORS
          
          // Ajouter des écouteurs d'événements pour le débogage
          audioRef.current.addEventListener('loadstart', () => {
            console.log('🔄 Début du chargement audio');
          });
          
          audioRef.current.addEventListener('canplay', () => {
            console.log('✅ Audio prêt à être lu');
          });
          
          audioRef.current.addEventListener('canplaythrough', () => {
            console.log('✅ Audio prêt à être lu entièrement sans mise en mémoire tampon');
          });
          
          audioRef.current.addEventListener('error', (e) => {
            const audioElement = e.currentTarget as HTMLAudioElement;
            const errorMsg = audioElement.error ? 
              `Erreur audio ${audioElement.error.code}: ${audioElement.error.message}` : 
              'Erreur audio inconnue';
            console.error('❌ Erreur de lecture audio:', errorMsg);
            setError(errorMsg);
            setIsPlaying(false);
          });
          
          audioRef.current.addEventListener('ended', () => {
            console.log('🔄 Lecture audio terminée');
            setIsPlaying(false);
          });
          
          audioRef.current.addEventListener('pause', () => {
            console.log('⏸️ Audio mis en pause');
            setIsPlaying(false);
          });
          
          audioRef.current.addEventListener('play', () => {
            console.log('▶️ Audio en cours de lecture');
            setIsPlaying(true);
          });
        }
        
        // Définir la source audio
        if (audioRef.current.src !== publicUrl.publicUrl) {
          console.log("🔄 Mise à jour de la source audio");
          audioRef.current.src = publicUrl.publicUrl;
          
          // Précharger le fichier
          audioRef.current.load();
        }
        
        // Démarrer la lecture automatiquement si requis
        if (autoPlay && audioRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
          console.log('🔄 Tentative de lecture automatique...');
          try {
            await audioRef.current.play();
            console.log('✅ Lecture automatique démarrée');
            setIsPlaying(true);
          } catch (playError) {
            console.error('❌ Erreur de lecture automatique:', playError);
            setError(`Lecture auto impossible: ${playError instanceof Error ? playError.message : String(playError)}`);
          }
        }
      } catch (error: any) {
        console.error('❌ Erreur de configuration audio:', error);
        setError(`Configuration échouée: ${error.message || 'Erreur inconnue'}`);
      }
    };

    setupAudio();
    
    // Nettoyer lors du démontage du composant
    return () => {
      console.log('🧹 Nettoyage du fond sonore');
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        setIsPlaying(false);
      }
    };
  }, [soundDetails, autoPlay, musicEnabled]);

  // Méthode pour basculer la lecture
  const togglePlay = useCallback(async () => {
    if (!audioRef.current || !musicEnabled) {
      console.log("❌ Impossible de basculer la lecture - audio non disponible ou musique désactivée");
      return;
    }
    
    console.log(`🔄 Bascule de lecture - État actuel: ${isPlaying ? 'En lecture' : 'En pause'}`);
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        console.log('⏸️ Lecture mise en pause');
      } else {
        // Vérifier si l'audio est prêt avant de jouer
        if (audioRef.current.readyState < 2) {
          console.log('🔄 Audio pas encore prêt, attente...');
          await new Promise((resolve) => {
            const onCanPlay = () => {
              audioRef.current?.removeEventListener('canplay', onCanPlay);
              resolve(void 0);
            };
            audioRef.current?.addEventListener('canplay', onCanPlay);
          });
        }
        
        await audioRef.current.play();
        console.log('▶️ Lecture démarrée');
      }
    } catch (err: any) {
      console.error('❌ Erreur de lecture/pause:', err);
      setError(`Erreur de lecture: ${err.message || 'Erreur inconnue'}`);
      toast({
        title: 'Erreur',
        description: 'Impossible de lire le fond sonore',
        variant: 'destructive',
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

export default useSoundPlayer;

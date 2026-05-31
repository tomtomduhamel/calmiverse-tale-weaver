import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Loader2, Download, RefreshCw, X, Check } from 'lucide-react';
import { useN8nAudioGeneration } from '@/hooks/story/audio/useN8nAudioGeneration';
import { useToast } from '@/hooks/use-toast';
import { getSignedAudioUrl } from '@/utils/storageUtils';
import { audioCache } from '@/utils/audioCache';

interface N8nAudioPlayerProps {
  storyId: string;
  text: string;
  isDarkMode?: boolean;
  compact?: boolean;
}

export const N8nAudioPlayer: React.FC<N8nAudioPlayerProps> = ({
  storyId,
  text,
  isDarkMode = false,
  compact = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const {
    toast
  } = useToast();
  const {
    isGenerating,
    audioFiles,
    generateAudio,
    fetchAudioFiles,
    deleteAudioFile,
    cleanupStuckFiles,
    recoverErrorFiles
  } = useN8nAudioGeneration();

  // Charger les fichiers audio existants et nettoyer/récupérer les fichiers
  useEffect(() => {
    const loadAndCleanup = async () => {
      await cleanupStuckFiles(storyId);
      await recoverErrorFiles(storyId);
      await fetchAudioFiles(storyId);
    };
    loadAndCleanup();
  }, [storyId, fetchAudioFiles, cleanupStuckFiles, recoverErrorFiles]);

  // Trouver les fichiers audio pour cette histoire
  const readyAudioFile = audioFiles.find(file => file.status === 'ready' && file.audio_url);
  const pendingAudioFile = audioFiles.find(file => file.status === 'pending' || file.status === 'processing');

  // Fichier en erreur SANS URL
  const errorAudioFile = audioFiles.find(file => file.status === 'error' && !file.audio_url);

  // Fichier récupérable (en erreur mais avec URL)
  const recoverableAudioFile = audioFiles.find(file => file.status === 'error' && file.audio_url);

  // Effet pour pré-charger l'audio dans le cache IndexedDB dès qu'il est prêt
  useEffect(() => {
    const prefetchAudio = async () => {
      if (readyAudioFile?.audio_url) {
        try {
          const cached = await audioCache.has(storyId);
          if (cached) {
            setIsOfflineReady(true);
            return;
          }

          setIsCaching(true);
          const signedUrl = await getSignedAudioUrl(readyAudioFile.audio_url);
          if (signedUrl) {
            await audioCache.prefetchAndCache(storyId, signedUrl);
            setIsOfflineReady(true);
          }
        } catch (error) {
          console.error('[N8nAudioPlayer] Erreur pré-chargement cache audio :', error);
        } finally {
          setIsCaching(false);
        }
      } else {
        setIsOfflineReady(false);
      }
    };

    prefetchAudio();
  }, [readyAudioFile?.audio_url, storyId]);

  // Gérer la lecture audio
  const handlePlayPause = async () => {
    if (!readyAudioFile?.audio_url) {
      toast({
        title: "Aucun audio disponible",
        description: "Générez d'abord l'audio pour cette histoire",
        variant: "destructive"
      });
      return;
    }
    if (isPlaying && currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
      return;
    }
    try {
      // Arrêter l'audio précédent s'il existe
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      let audioUrl = "";

      // 1. Tenter de lire depuis le cache local IndexedDB (fonctionne offline)
      const cachedBlob = await audioCache.get(storyId);
      if (cachedBlob) {
        audioUrl = URL.createObjectURL(cachedBlob);
        console.log("⚡ [N8nAudioPlayer] Lecture de l'audio depuis le cache IndexedDB (Offline)");
      } else {
        // 2. Fallback réseau si non mis en cache
        if (!navigator.onLine) {
          toast({
            title: "Mode Hors-ligne",
            description: "Cet audio n'a pas été pré-téléchargé et ne peut pas être lu sans connexion.",
            variant: "destructive"
          });
          return;
        }

        const signedUrl = await getSignedAudioUrl(readyAudioFile.audio_url);
        if (!signedUrl) {
          toast({
            title: "Erreur",
            description: "Impossible d'obtenir l'URL audio",
            variant: "destructive"
          });
          return;
        }
        audioUrl = signedUrl;

        // Sauvegarder dans le cache en tâche de fond pour la suite
        audioCache.prefetchAndCache(storyId, signedUrl).then(() => {
          setIsOfflineReady(true);
        });
      }

      // Créer un nouveau lecteur audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setCurrentAudio(audio);

      // Event listeners
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      audio.addEventListener('timeupdate', () => {
        setProgress(audio.currentTime / audio.duration * 100);
      });
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
        if (cachedBlob) {
          URL.revokeObjectURL(audioUrl); // Libérer la mémoire
        }
      });
      audio.addEventListener('error', () => {
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire le fichier audio",
          variant: "destructive"
        });
        setIsPlaying(false);
        if (cachedBlob) {
          URL.revokeObjectURL(audioUrl);
        }
      });
      await audio.play();
      setIsPlaying(true);
    } catch (error: any) {
      console.error('Erreur lecture audio:', error);
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire l'audio",
        variant: "destructive"
      });
    }
  };

  // Générer un nouveau fichier audio
  const handleGenerateAudio = async () => {
    await generateAudio(storyId, text);
  };

  // Rafraîchir les fichiers et récupérer ceux en erreur
  const handleRefresh = async () => {
    await cleanupStuckFiles(storyId);
    await recoverErrorFiles(storyId);
    await fetchAudioFiles(storyId);
  };

  // Récupérer un fichier marqué erreur mais avec URL
  const handleRecoverFile = async () => {
    if (recoverableAudioFile) {
      await recoverErrorFiles(storyId);
    }
  };

  // Supprimer un fichier en erreur
  const handleDeleteErrorFile = async () => {
    if (errorAudioFile) {
      await deleteAudioFile(errorAudioFile.id);
      await fetchAudioFiles(storyId);
    }
  };

  // Nettoyer à la destruction du composant
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, [currentAudio]);

  const getStatusMessage = () => {
    if (pendingAudioFile) {
      if (pendingAudioFile.status === 'pending') {
        return <div className="text-xs text-center text-muted-foreground animate-pulse">
            En attente de traitement par le serveur...
          </div>;
      }
      if (pendingAudioFile.status === 'processing') {
        return <div className="text-xs text-center text-primary animate-pulse">Génération vocale en cours par votre VPS...</div>;
      }
    }
    if (recoverableAudioFile) {
      return <div className="text-xs text-center text-primary-soft">
          Fichier récupérable (cliquez sur récupérer)
        </div>;
    }
    return null;
  };

  // Mode compact : uniquement les icônes essentielles
  if (compact) {
    return <div className="flex items-center gap-1">
        {/* Bouton principal - Play/Pause ou Générer */}
        <Button onClick={readyAudioFile ? handlePlayPause : handleGenerateAudio} disabled={isGenerating || !!pendingAudioFile} variant="outline" size="icon" className="h-8 w-8">
          {isGenerating || pendingAudioFile ? <Loader2 className="h-4 w-4 animate-spin" /> : readyAudioFile ? isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>

        {/* Bouton refresh - toujours visible en mode compact */}
        <Button onClick={handleRefresh} variant="outline" size="icon" className="h-8 w-8">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>;
  }

  // Mode normal (desktop/mobile)
  return <div className="space-y-3">
      {/* Bouton principal */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={readyAudioFile ? handlePlayPause : handleGenerateAudio} disabled={isGenerating || !!pendingAudioFile} variant="outline" size="sm">
          {isGenerating ? <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Génération...
            </> : pendingAudioFile ? <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              En cours...
            </> : readyAudioFile ? <>
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? 'Pause' : "Écouter l'histoire"}
            </> : <>
              <Volume2 className="h-4 w-4 mr-2" />
              Générer la voix de Thomas
            </>}
        </Button>

        {/* Bouton refresh */}
        <Button onClick={handleRefresh} variant="outline" size="icon" className="h-9 w-9" title="Actualiser le statut">
          <RefreshCw className="h-4 w-4" />
        </Button>

        {/* Bouton récupérer fichier en erreur avec URL */}
        {recoverableAudioFile && <Button onClick={handleRecoverFile} variant="outline" size="icon" className="text-accent-foreground hover:bg-accent/20" title="Récupérer le fichier audio">
            <RefreshCw className="h-4 w-4" />
          </Button>}

        {/* Bouton supprimer fichier en erreur SANS URL */}
        {errorAudioFile && <Button onClick={handleDeleteErrorFile} variant="outline" size="icon" className="text-destructive hover:bg-destructive/10">
            <X className="h-4 w-4" />
          </Button>}
      </div>

      {/* Barre de progression */}
      {isPlaying && readyAudioFile && <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div className="bg-primary h-2 rounded-full transition-all duration-300 shadow-glow-primary" style={{
        width: `${progress}%`
      }}></div>
        </div>}

      {/* Message de statut */}
      {getStatusMessage()}

      {/* Indicateur de caching offline Premium */}
      {isOfflineReady && (
        <div className={`text-xs flex items-center justify-start gap-1.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'} font-medium`}>
          <Check className="h-3.5 w-3.5" />
          Disponible hors-ligne (Prête pour le lit 🛌)
        </div>
      )}
      {isCaching && (
        <div className="text-xs text-muted-foreground animate-pulse">
          Mise en cache offline en cours…
        </div>
      )}

      {/* Lien de téléchargement si disponible */}
      {readyAudioFile?.audio_url && <div className="text-left pt-1">
          <button 
            onClick={async () => {
              const url = await getSignedAudioUrl(readyAudioFile.audio_url);
              if (url) window.open(url, '_blank');
            }}
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            <Download className="h-3 w-3 mr-1" />
            Télécharger le fichier .mp3
          </button>
        </div>}
    </div>;
};
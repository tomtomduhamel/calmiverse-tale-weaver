import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Loader2, Download, RefreshCw, X } from 'lucide-react';
import { useN8nAudioGeneration } from '@/hooks/story/audio/useN8nAudioGeneration';
import { useToast } from '@/hooks/use-toast';
import { getSignedAudioUrl } from '@/utils/storageUtils';
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

  // Trouver les fichiers audio pour cette histoire (déjà filtré par story_id dans le hook)
  // On prend le fichier le plus récent pour chaque statut
  const readyAudioFile = audioFiles.find(file => file.status === 'ready' && file.audio_url);
  const pendingAudioFile = audioFiles.find(file => file.status === 'pending' || file.status === 'processing');

  // Fichier en erreur SANS URL (vraie erreur)
  const errorAudioFile = audioFiles.find(file => file.status === 'error' && !file.audio_url);

  // Fichier récupérable (en erreur mais avec URL)
  const recoverableAudioFile = audioFiles.find(file => file.status === 'error' && file.audio_url);

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

      // Get signed URL for the audio file
      const signedUrl = await getSignedAudioUrl(readyAudioFile.audio_url);
      if (!signedUrl) {
        toast({
          title: "Erreur",
          description: "Impossible d'obtenir l'URL audio",
          variant: "destructive"
        });
        return;
      }

      // Créer un nouveau lecteur audio
      const audio = new Audio(signedUrl);
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
      });
      audio.addEventListener('error', () => {
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire le fichier audio",
          variant: "destructive"
        });
        setIsPlaying(false);
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
        return <div className={`text-xs text-center ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
            🕒 En attente de traitement par n8n (timeout: 60s)
          </div>;
      }
      if (pendingAudioFile.status === 'processing') {
        return <div className={`text-xs text-center ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>⚙️ Génération audio en cours</div>;
      }
    }
    if (recoverableAudioFile) {
      return <div className={`text-xs text-center ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
          🔧 Fichier récupérable (cliquez sur récupérer)
        </div>;
    }
    if (errorAudioFile) {
      return;
    }
    if (readyAudioFile) {
      return;
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

  // Mode normal (desktop)
  return <div className="space-y-3">
      {/* Bouton principal */}
      <div className="flex gap-2">
        <Button onClick={readyAudioFile ? handlePlayPause : handleGenerateAudio} disabled={isGenerating || !!pendingAudioFile} className={`${isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}`} variant="outline" size="sm">
          {isGenerating ? <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Génération...
            </> : pendingAudioFile ? <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              En cours...
            </> : readyAudioFile ? <>
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Lire l\'audio'}
            </> : <>
              <Volume2 className="h-4 w-4 mr-2" />
              Générer l'audio
            </>}
        </Button>

        {/* Bouton refresh */}
        

        {/* Bouton récupérer fichier en erreur avec URL */}
        {recoverableAudioFile && <Button onClick={handleRecoverFile} variant="outline" size="icon" className={`text-green-500 hover:text-green-600 ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : ''}`} title="Récupérer le fichier audio">
            <RefreshCw className="h-4 w-4" />
          </Button>}

        {/* Bouton supprimer fichier en erreur SANS URL */}
        {errorAudioFile && <Button onClick={handleDeleteErrorFile} variant="outline" size="icon" className={`text-red-500 hover:text-red-600 ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : ''}`}>
            <X className="h-4 w-4" />
          </Button>}
      </div>

      {/* Barre de progression */}
      {isPlaying && readyAudioFile && <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{
        width: `${progress}%`
      }}></div>
        </div>}

      {/* Message de statut */}
      {getStatusMessage()}

      {/* Lien de téléchargement si disponible */}
      {readyAudioFile?.audio_url && <div className="text-center">
          <button 
            onClick={async () => {
              const url = await getSignedAudioUrl(readyAudioFile.audio_url);
              if (url) window.open(url, '_blank');
            }}
            className={`inline-flex items-center text-xs hover:underline ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-500'}`}
          >
            <Download className="h-3 w-3 mr-1" />
            Télécharger l'audio
          </button>
        </div>}
    </div>;
};
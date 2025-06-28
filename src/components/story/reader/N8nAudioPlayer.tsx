
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Loader2, Download, RefreshCw } from 'lucide-react';
import { useN8nAudioGeneration } from '@/hooks/story/audio/useN8nAudioGeneration';
import { useToast } from '@/hooks/use-toast';

interface N8nAudioPlayerProps {
  storyId: string;
  text: string;
  isDarkMode?: boolean;
}

export const N8nAudioPlayer: React.FC<N8nAudioPlayerProps> = ({
  storyId,
  text,
  isDarkMode = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const {
    isGenerating,
    audioFiles,
    generateAudio,
    fetchAudioFiles
  } = useN8nAudioGeneration();

  // Charger les fichiers audio existants
  useEffect(() => {
    fetchAudioFiles(storyId);
  }, [storyId, fetchAudioFiles]);

  // Trouver le fichier audio prêt pour ce texte
  const readyAudioFile = audioFiles.find(
    file => file.status === 'ready' && file.audio_url && 
    file.text_content.substring(0, 100) === text.substring(0, 100)
  );

  const pendingAudioFile = audioFiles.find(
    file => (file.status === 'pending' || file.status === 'processing') &&
    file.text_content.substring(0, 100) === text.substring(0, 100)
  );

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

      // Créer un nouveau lecteur audio
      const audio = new Audio(readyAudioFile.audio_url);
      audioRef.current = audio;
      setCurrentAudio(audio);

      // Event listeners
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        setProgress((audio.currentTime / audio.duration) * 100);
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

  // Rafraîchir les fichiers
  const handleRefresh = async () => {
    await fetchAudioFiles(storyId);
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
        return (
          <div className={`text-xs text-center ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
            🕒 En attente de traitement par n8n
          </div>
        );
      }
      if (pendingAudioFile.status === 'processing') {
        return (
          <div className={`text-xs text-center ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            ⚙️ Génération audio en cours via n8n
          </div>
        );
      }
    }

    if (readyAudioFile) {
      return (
        <div className={`text-xs text-center ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
          🎵 Audio Premium (ElevenLabs via n8n)
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-3">
      {/* Bouton principal */}
      <div className="flex gap-2">
        <Button
          onClick={readyAudioFile ? handlePlayPause : handleGenerateAudio}
          disabled={isGenerating || !!pendingAudioFile}
          className={`flex-1 ${isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}`}
          variant="outline"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Génération...
            </>
          ) : pendingAudioFile ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              En cours...
            </>
          ) : readyAudioFile ? (
            <>
              {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Lire l\'audio'}
            </>
          ) : (
            <>
              <Volume2 className="h-4 w-4 mr-2" />
              Générer l'audio
            </>
          )}
        </Button>

        {/* Bouton refresh */}
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="icon"
          className={isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Barre de progression */}
      {isPlaying && readyAudioFile && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Message de statut */}
      {getStatusMessage()}

      {/* Lien de téléchargement si disponible */}
      {readyAudioFile?.audio_url && (
        <div className="text-center">
          <a
            href={readyAudioFile.audio_url}
            download
            className={`inline-flex items-center text-xs hover:underline ${
              isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-500'
            }`}
          >
            <Download className="h-3 w-3 mr-1" />
            Télécharger l'audio
          </a>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX,
  Music, Sliders, ChevronUp, ChevronDown, Check, Loader2, Sparkles, Download, RefreshCw
} from 'lucide-react';
import { useN8nAudioGeneration } from '@/hooks/story/audio/useN8nAudioGeneration';
import { useBackgroundSound } from '@/hooks/story/sound/useBackgroundSound';
import { useUserSettings } from '@/hooks/settings/useUserSettings';
import { useSubscription } from '@/hooks/subscription/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { getSignedAudioUrl } from '@/utils/storageUtils';
import { audioCache } from '@/utils/audioCache';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { extractObjectiveValue } from '@/utils/objectiveUtils';
import { useNavigate } from 'react-router-dom';

interface IntegratedAudioDeckProps {
  storyId: string;
  text: string;
  soundId?: string | null;
  objective?: string | null;
  isDarkMode?: boolean;
}

interface CustomVoice {
  id: string;
  name: string;
  relation: string;
  voice_ref_path: string;
  transcript: string | null;
}

export const IntegratedAudioDeck: React.FC<IntegratedAudioDeckProps> = ({
  storyId,
  text,
  soundId,
  objective,
  isDarkMode = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [isCaching, setIsCaching] = useState(false);
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('local');
  const [provider, setProvider] = useState<string>('vps-hostinger');
  const navigate = useNavigate();
  
  // Browser SpeechSynthesis state
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState(false);
  const [isBrowserPaused, setIsBrowserPaused] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { userSettings, updateUserSettings } = useUserSettings();
  const { limits } = useSubscription();

  // Premium Voice Generation Hook
  const {
    isGenerating,
    audioFiles,
    generateAudio,
    fetchAudioFiles,
    cleanupStuckFiles,
    recoverErrorFiles,
    subscribeToAudioFiles
  } = useN8nAudioGeneration();

  // Premium audio checking (S'active si le mode premium est sélectionné OU si un audio Studio existe déjà)
  const canUsePremiumAudio = limits?.has_multivoice_audio ?? false;
  const preferredAudioMode = userSettings.readingPreferences?.audioMode ?? 'browser';
  const readyStoryAudioFile = audioFiles.find(
    file => file.status === 'ready' && file.audio_url && file.story_id === storyId
  );
  const isPremiumMode = (preferredAudioMode === 'premium' && canUsePremiumAudio && selectedVoiceId !== 'local') || !!readyStoryAudioFile;

  // Background Sound Hook
  const backgroundSound = useBackgroundSound({
    soundId,
    storyObjective: extractObjectiveValue(objective) || undefined,
    autoPlay: false
  });

  const [isCheckingAudioStatus, setIsCheckingAudioStatus] = useState<boolean>(true);

  // Activer la souscription Realtime et les écouteurs de visibilité
  useEffect(() => {
    if (!storyId) return;
    const cleanup = subscribeToAudioFiles(storyId);
    return () => {
      if (cleanup) cleanup();
    };
  }, [storyId, subscribeToAudioFiles]);

  // Load voices & files
  useEffect(() => {
    synthRef.current = window.speechSynthesis;

    const loadData = async () => {
      setIsCheckingAudioStatus(true);
      try {
        await cleanupStuckFiles(storyId);
        await recoverErrorFiles(storyId);
        const fetchedFiles = await fetchAudioFiles(storyId);

        let activeProvider = 'vps-hostinger';
        // Fetch active TTS provider config
        try {
          const { data: ttsConfig } = await supabase.functions.invoke('get-tts-config');
          if (ttsConfig?.provider) {
            activeProvider = ttsConfig.provider;
            setProvider(ttsConfig.provider);
          }
        } catch (err) {
          console.error('Error fetching TTS provider:', err);
        }

        // Fetch custom user voices
        try {
          const { data, error } = await supabase
            .from('user_voices')
            .select('id, name, relation, voice_ref_path, transcript');
          if (!error && data) {
            setCustomVoices(data as CustomVoice[]);
            
            // Vérifier si un fichier audio Studio prêt existe pour cette histoire
            const readyFile = fetchedFiles.find(f => f.status === 'ready' && f.audio_url && f.story_id === storyId);
            if (readyFile) {
              const matchingVoiceId = (readyFile.voice_id && readyFile.voice_id !== 'local')
                ? readyFile.voice_id
                : (data.length > 0 ? data[0].id : 'local');
              setSelectedVoiceId(matchingVoiceId);
            } else if (canUsePremiumAudio && preferredAudioMode === 'premium' && data.length > 0) {
              setSelectedVoiceId(data[0].id);
            } else {
              setSelectedVoiceId('local');
            }
          }
        } catch (err) {
          console.error('Error fetching custom voices:', err);
        }
      } finally {
        setIsCheckingAudioStatus(false);
      }
    };

    loadData();

    return () => {
      // Cleanup browser TTS on unmount
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [storyId, fetchAudioFiles, cleanupStuckFiles, recoverErrorFiles]);

  // Split text into sentences dynamically
  const paragraphs = React.useMemo(() => {
    if (!text) return [];
    
    // First, strip all modulation tags from the entire text
    const cleanText = text
      .replace(/\[.*?\]/g, "")
      .replace(/\s+/g, " ")
      .trim();
      
    // Split by sentences using positive lookbehind to preserve punctuation
    return cleanText
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }, [text]);

  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(0);
  const [autoplayNext, setAutoplayNext] = useState<boolean>(false);

  // Find audio file for the current story or paragraph
  const currentParagraphText = paragraphs[currentParagraphIndex] || '';
  const currentAudioFile = readyStoryAudioFile || (
    (selectedVoiceId !== 'local')
      ? audioFiles.find(
          file => file.status === 'ready' && file.audio_url && (file.voice_id === selectedVoiceId || !file.voice_id) && (file.text_content === currentParagraphText || file.story_id === storyId)
        )
      : undefined
  );
  const currentPendingAudioFile = (selectedVoiceId !== 'local')
    ? audioFiles.find(
        file => (file.status === 'pending' || file.status === 'processing') && file.story_id === storyId
      )
    : undefined;

  // Auto-synchroniser le sélecteur de voix sur l'audio généré disponible
  useEffect(() => {
    if (readyStoryAudioFile) {
      if (readyStoryAudioFile.voice_id && readyStoryAudioFile.voice_id !== 'local') {
        if (selectedVoiceId !== readyStoryAudioFile.voice_id) {
          setSelectedVoiceId(readyStoryAudioFile.voice_id);
        }
      } else if (selectedVoiceId === 'local' && customVoices.length > 0) {
        setSelectedVoiceId(customVoices[0].id);
      }
    }
  }, [readyStoryAudioFile, customVoices]);

  // Cache checking for current paragraph
  useEffect(() => {
    const checkCache = async () => {
      if (isPremiumMode && paragraphs.length > 0) {
        const cacheKey = `${storyId}_p_${currentParagraphIndex}`;
        const cached = await audioCache.has(cacheKey);
        setIsOfflineReady(cached);
      } else {
        setIsOfflineReady(false);
      }
    };
    checkCache();
  }, [currentParagraphIndex, isPremiumMode, storyId, paragraphs]);



  // Autoplay next paragraph transition
  useEffect(() => {
    if (autoplayNext && isPremiumMode) {
      setAutoplayNext(false);
      const pText = paragraphs[currentParagraphIndex];
      const pAudioFile = audioFiles.find(
        file => file.text_content === pText && file.voice_id === selectedVoiceId && file.status === 'ready'
      );
      if (pAudioFile) {
        console.log(`▶️ [AudioDeck] Autoplaying paragraph ${currentParagraphIndex + 1}`);
        handlePlayPause();
      } else {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      }
    }
  }, [currentParagraphIndex, autoplayNext, audioFiles, isPremiumMode, selectedVoiceId, paragraphs]);

  // Sync volume with background audio player
  const handleMusicVolumeChange = (values: number[]) => {
    backgroundSound.setVolume(values[0]);
  };

  // Switch between Browser (Free) and Premium
  const toggleAudioMode = async () => {
    if (!canUsePremiumAudio) {
      toast({
        title: "Fonctionnalité Premium",
        description: "Abonnez-vous à Calmix ou Calmixxl pour débloquer le livre audio multi-voix haute-fidélité.",
      });
      return;
    }
    const newMode = isPremiumMode ? 'browser' : 'premium';
    
    // Stop all playbacks
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    }
    if (isBrowserSpeaking) {
      if (synthRef.current) synthRef.current.cancel();
      setIsBrowserSpeaking(false);
      setIsBrowserPaused(false);
    }

    try {
      await updateUserSettings({
        readingPreferences: {
          ...userSettings.readingPreferences,
          audioMode: newMode
        }
      });
      toast({
        title: `Mode audio : ${newMode === 'premium' ? 'Premium 🌟' : 'Synthèse locale 🔊'}`,
        description: newMode === 'premium' 
          ? "Vous écoutez les voix haute fidélité" 
          : "Vous utilisez le synthétiseur gratuit de votre appareil"
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Play Browser synthesis paragraph-by-paragraph with auto-advance
  const playBrowserParagraph = (index: number) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel(); // Cancel any current utterance
    
    const pText = paragraphs[index];
    if (!pText) {
      setIsPlaying(false);
      setIsBrowserSpeaking(false);
      setIsBrowserPaused(false);
      setCurrentParagraphIndex(0);
      setProgress(0);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(pText);
    utterance.lang = 'fr-FR';
    
    const voices = synthRef.current.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith('fr'));
    if (frVoice) utterance.voice = frVoice;
    
    utterance.rate = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsBrowserSpeaking(true);
      setIsBrowserPaused(false);
      const pct = (index / (paragraphs.length - 1 || 1)) * 100;
      setProgress(pct);
    };

    utterance.onend = () => {
      const nextIndex = index + 1;
      if (nextIndex < paragraphs.length) {
        setCurrentParagraphIndex(nextIndex);
        playBrowserParagraph(nextIndex);
      } else {
        setIsPlaying(false);
        setIsBrowserSpeaking(false);
        setIsBrowserPaused(false);
        setCurrentParagraphIndex(0);
        setProgress(0);
      }
    };

    utterance.onerror = (event) => {
      console.error("SpeechSynthesis error:", event);
      setIsPlaying(false);
      setIsBrowserSpeaking(false);
      setIsBrowserPaused(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Voice Selection Dropdown handler
  const handleVoiceChange = (value: string) => {
    if (value === 'upgrade_info') {
      toast({
        title: "Fonctionnalité Premium",
        description: "Abonnez-vous à un plan Calmi (Calmidium, Calmix, Calmixxl) pour débloquer le clonage vocal !",
      });
      return;
    }

    if (value === 'record_prompt') {
      toast({
        title: "Studio Vocal",
        description: "Redirection vers le Studio Vocal pour enregistrer la voix de vos proches...",
      });
      navigate('/app/voices');
      return;
    }

    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      if (synthRef.current) synthRef.current.cancel();
      setIsPlaying(false);
    }
    if (isBrowserSpeaking) {
      if (synthRef.current) synthRef.current.cancel();
      setIsBrowserSpeaking(false);
      setIsBrowserPaused(false);
    }

    setSelectedVoiceId(value);

    const isCustomVoice = value !== 'local';
    const newMode = isCustomVoice ? 'premium' : 'browser';

    updateUserSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        audioMode: newMode
      }
    });

    toast({
      title: isCustomVoice ? "Mode Premium activé 🌟" : "Mode Gratuit activé 🔊",
      description: isCustomVoice 
        ? "Lecture haute-fidélité avec la voix clonée sélectionnée."
        : "Lecture gratuite par synthèse locale de l'appareil."
    });
  };

  // Re-génération explicite de l'audio Studio avec la voix actuellement sélectionnée
  const handleForceRegenerate = async () => {
    if (isGenerating || currentPendingAudioFile) {
      toast({
        title: "Génération en cours",
        description: "Le livre audio est en cours de création sur le serveur...",
      });
      return;
    }

    const selectedVoice = customVoices.find(v => v.id === selectedVoiceId);
    const voiceName = selectedVoice ? `la voix de ${selectedVoice.relation}` : "la voix sélectionnée";

    toast({
      title: "🚀 Re-génération lancée !",
      description: `Création d'une nouvelle version du livre audio avec ${voiceName}...`,
    });

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    if (isBrowserSpeaking && synthRef.current) {
      synthRef.current.cancel();
      setIsBrowserSpeaking(false);
      setIsBrowserPaused(false);
    }

    await generateAudio(storyId, text, selectedVoiceId);
  };

  // Control Play/Pause (Priorité absolue à l'audio généré s'il existe)
  const handlePlayPause = async () => {
    // 1. Si un fichier audio Studio est déjà prêt pour cette histoire, ON LE LANCE DIRECTEMENT !
    const targetReadyFile = currentAudioFile || readyStoryAudioFile;

    if (targetReadyFile?.audio_url) {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      if (isBrowserSpeaking && synthRef.current) {
        synthRef.current.cancel();
        setIsBrowserSpeaking(false);
        setIsBrowserPaused(false);
      }

      try {
        let audioUrl = "";
        const cacheKey = `story_${storyId}`;
        const cachedBlob = await audioCache.get(cacheKey);

        if (cachedBlob) {
          audioUrl = URL.createObjectURL(cachedBlob);
          console.log("⚡ [AudioDeck] Lecture de l'histoire complète depuis le cache IndexedDB");
        } else {
          const signedUrl = await getSignedAudioUrl(targetReadyFile.audio_url);
          if (!signedUrl) throw new Error("Impossible d'obtenir l'URL d'accès au fichier audio");
          audioUrl = signedUrl;

          // Mise en cache hors-ligne en arrière-plan
          audioCache.prefetchAndCache(cacheKey, signedUrl).then(() => {
            setIsOfflineReady(true);
          }).catch(err => {
            console.error('[AudioDeck] Cache error:', err);
          });
        }

        const audio = audioRef.current || new Audio();
        if (audio.src !== audioUrl) {
          audio.src = audioUrl;
        }
        audioRef.current = audio;

        audio.playbackRate = 1.0;

        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
        };
        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);
          }
        };
        audio.onended = () => {
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime(0);
        };
        audio.onerror = (e) => {
          console.error('[AudioDeck] Audio element error:', e);
          toast({
            title: "Erreur d'accès audio",
            description: "Impossible d'accéder au fichier audio Studio. Utilisez le bouton 'Re-générer' pour le recréer.",
            variant: "destructive"
          });
          setIsPlaying(false);
        };

        if (currentTime > 0 && currentTime < duration) {
          audio.currentTime = currentTime;
        }

        await audio.play();
        setIsPlaying(true);

        if (targetReadyFile.voice_id && targetReadyFile.voice_id !== 'local') {
          setSelectedVoiceId(targetReadyFile.voice_id);
        }
      } catch (err: any) {
        console.error("Audio playback error:", err);
        toast({
          title: "Erreur de lecture",
          description: err?.message || "Impossible de lire le fichier audio Studio",
          variant: "destructive"
        });
        setIsPlaying(false);
      }
      return;
    }

    // 3. Si une voix Premium est sélectionnée mais qu'aucune génération n'est encore prête
    if (currentPendingAudioFile || isGenerating) {
      toast({
        title: "Génération en cours",
        description: "Le livre audio est en cours de création sur notre serveur...",
      });
      return;
    }

    // Déclencher la génération uniquement si aucun audio n'existe
    toast({
      title: "Lancement de la création",
      description: "Le livre audio Studio démarre en arrière-plan...",
    });
    await generateAudio(storyId, text, selectedVoiceId);
  };

  // Rewind to previous paragraph
  const handleRewind = () => {
    const prevIndex = currentParagraphIndex - 1;
    if (prevIndex >= 0) {
      if (isPremiumMode) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setCurrentTime(0);
      } else {
        if (synthRef.current) {
          synthRef.current.cancel();
        }
      }
      setCurrentParagraphIndex(prevIndex);
      setProgress((prevIndex / (paragraphs.length - 1 || 1)) * 100);
      if (isPlaying) {
        if (isPremiumMode) {
          setAutoplayNext(true);
        } else {
          playBrowserParagraph(prevIndex);
        }
      }
    }
  };

  // Fast forward to next paragraph
  const handleFastForward = () => {
    const nextIndex = currentParagraphIndex + 1;
    if (nextIndex < paragraphs.length) {
      if (isPremiumMode) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setCurrentTime(0);
      } else {
        if (synthRef.current) {
          synthRef.current.cancel();
        }
      }
      setCurrentParagraphIndex(nextIndex);
      setProgress((nextIndex / (paragraphs.length - 1 || 1)) * 100);
      if (isPlaying) {
        if (isPremiumMode) {
          setAutoplayNext(true);
        } else {
          playBrowserParagraph(nextIndex);
        }
      }
    }
  };

  // Seeking on the timeline for current paragraph
  const handleTimelineChange = (values: number[]) => {
    const pct = values[0];
    if (isPremiumMode) {
      if (audioRef.current && duration > 0) {
        const targetTime = (pct / 100) * duration;
        audioRef.current.currentTime = targetTime;
        setCurrentTime(targetTime);
        setProgress(pct);
      }
    } else {
      const targetIndex = Math.min(
        paragraphs.length - 1,
        Math.max(0, Math.round((pct / 100) * (paragraphs.length - 1)))
      );
      if (targetIndex !== currentParagraphIndex) {
        if (synthRef.current) {
          synthRef.current.cancel();
        }
        setCurrentParagraphIndex(targetIndex);
        setProgress((targetIndex / (paragraphs.length - 1 || 1)) * 100);
        if (isPlaying) {
          playBrowserParagraph(targetIndex);
        }
      }
    }
  };

  // Time formatter (0:00)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Narrator Label
  const getNarratorName = () => {
    if (selectedVoiceId === 'local') {
      return "Voix par défaut de votre appareil";
    }
    const custom = customVoices.find(v => v.id === selectedVoiceId);
    if (custom) return `Voix : ${custom.name} (${custom.relation})`;
    return "Voix Haute-Fidélité";
  };

    return (
      <div
        className={cn(
          "fixed bottom-2 left-2 right-2 sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-[600px] sm:-translate-x-1/2",
          "backdrop-blur-2xl border rounded-2xl shadow-floating z-[90] transition-all duration-300 ease-out",
          isDarkMode 
            ? "bg-gray-950/95 border-white/10 text-white shadow-black/50" 
            : "bg-white/95 border-primary-soft/40 text-gray-900 shadow-xl",
          isExpanded 
            ? "p-3.5 sm:p-5 max-h-[85vh] sm:max-h-[600px] flex flex-col" 
            : "p-3 max-h-[70px] flex items-center justify-between"
        )}
      >
        {/* 🟢 COLLAPSED VIEW */}
        {!isExpanded && (
          <>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                onClick={handlePlayPause}
                disabled={isGenerating || (isPremiumMode && !!currentPendingAudioFile)}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 shrink-0",
                  isDarkMode ? "bg-primary/20 text-primary-soft hover:bg-primary/30" : "bg-primary-soft/30 text-primary hover:bg-primary-soft/50"
                )}
              >
                {isGenerating || (isPremiumMode && currentPendingAudioFile) ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase opacity-70">
                  {isPremiumMode ? "🌟 Audio Premium" : "🔊 Audio Gratuit"}
                </p>
                <h4 className="text-xs sm:text-sm font-bold truncate">
                  {getNarratorName()}
                </h4>
              </div>

              {/* Caching badge */}
              {isPremiumMode && isOfflineReady && (
                <Badge variant="outline" className="hidden sm:inline-flex border-green-500/30 text-green-500 bg-green-500/5 text-[10px] gap-1 py-0 px-2 shrink-0">
                  <Check className="w-3 h-3" /> Hors-ligne
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-2 sm:ml-4">
              {/* Toggle background music directly from collapsed */}
              {soundId && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={backgroundSound.togglePlay}
                  className={cn(
                    "h-8 w-8 rounded-lg",
                    backgroundSound.isPlaying 
                      ? "text-primary bg-primary-soft/20" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                  title="Musique de fond"
                >
                  <Music className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(true)}
                className="h-8 w-8 rounded-lg"
                title="Déplier les contrôles audio"
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
            </div>
          </>
        )}

        {/* 🔴 EXPANDED VIEW */}
        {isExpanded && (
          <div className="w-full flex flex-col max-h-[calc(85vh-1.75rem)] sm:max-h-[550px]">
            {/* Header Panel (Fixe en haut) */}
            <div className="flex justify-between items-center pb-2.5 mb-2 border-b border-gray-200/80 dark:border-white/10 shrink-0">
              <div>
                <h3 className="font-display font-semibold italic text-sm sm:text-base flex items-center gap-1.5">
                  <span>🎵 Contrôles Audio Studio</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Ajustez la voix, la musique et lancez la lecture
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="h-7 w-7 rounded-full hover:bg-muted shrink-0"
                title="Fermer les contrôles"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </div>

            {/* Zone Scrollable Interne (Contenu Dépliable) */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-3 sm:space-y-4">
              {/* Selector block (Narrator voices & Background Music) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                {/* Colonne 1 : Voix du Narrateur Principal */}
                <div className="space-y-1.5">
                  <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                    🎙️ Voix du Narrateur Principal
                  </label>
                  <select
                    value={selectedVoiceId}
                    onChange={(e) => handleVoiceChange(e.target.value)}
                    className={cn(
                      "w-full text-xs font-medium rounded-xl p-2.5 border focus:outline-none focus:ring-1 transition-all h-10",
                      isDarkMode 
                        ? "bg-gray-900 border-gray-800 text-white focus:ring-primary focus:border-primary" 
                        : "bg-white border-primary-soft/50 text-gray-900 focus:ring-primary focus:border-primary"
                    )}
                  >
                    <option value="local">🔊 Voix de l'appareil (Gratuit)</option>
                    {customVoices.length > 0 && (
                      <optgroup label="Vos voix de narration (Studio)">
                        {customVoices.map((voice) => {
                          const hasReadyAudio = audioFiles.some(f => f.status === 'ready' && f.voice_id === voice.id && f.story_id === storyId);
                          return (
                            <option key={voice.id} value={voice.id}>
                              🎙️ Narrateur : Voix de {voice.relation} {hasReadyAudio ? "✅ (Prêt à l'écoute)" : ""}
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {customVoices.length === 0 && (
                      <>
                        {canUsePremiumAudio && (limits?.max_voice_clones ?? 0) > 0 ? (
                          <option value="record_prompt">🎙️ Enregistrer la voix du narrateur (Premium)</option>
                        ) : (
                          <option value="upgrade_info">🎙️ Cloner la voix d'un proche (Premium 🌟)</option>
                        )}
                      </>
                    )}
                  </select>
                </div>

                {/* Colonne 2 : Musique de fond */}
                {soundId && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                        🎵 Musique d'ambiance
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={backgroundSound.togglePlay}
                        className={cn(
                          "h-6 text-[10px] px-2 rounded-lg font-semibold transition-all",
                          backgroundSound.isPlaying 
                            ? (isDarkMode ? "text-primary bg-primary/20" : "text-primary bg-primary-soft/30")
                            : "text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {backgroundSound.isPlaying ? "Activée" : "Désactivée"}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2.5 pt-0.5 h-10">
                      <VolumeX className="w-4 h-4 text-muted-foreground shrink-0" />
                      <Slider
                        disabled={!backgroundSound.isPlaying}
                        value={[backgroundSound.volume]}
                        max={1}
                        step={0.05}
                        onValueChange={handleMusicVolumeChange}
                        className="flex-1 cursor-pointer"
                      />
                      <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                )}
              </div>

              {/* Bandeau d'information et d'action pleine largeur (Full Width) */}
              {selectedVoiceId !== 'local' && (
                <div className="w-full space-y-2 my-1">
                  <div className="bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 p-2.5 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                      <div>
                        <span className="font-semibold text-purple-800 dark:text-purple-300">Multi-Voix Automatique Actif</span>
                        <p className="text-[11px] opacity-80 leading-tight">
                          Les répliques des personnages seront automatiquement interprétées par vos autres voix clonées.
                        </p>
                      </div>
                    </div>
                    {/* N'afficher le bouton ici QUE si l'audio n'est pas encore prêt */}
                    {!currentAudioFile && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleForceRegenerate}
                        disabled={isGenerating || !!currentPendingAudioFile}
                        className="w-full sm:w-auto text-xs font-semibold h-8 px-3.5 shrink-0 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        {isGenerating || currentPendingAudioFile ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            <span>Création en cours…</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 text-primary" />
                            <span>Générer avec ce Narrateur</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Barre de Progression / Statut de Lecture */}
              <div className="space-y-2 py-0.5">
                {!isPremiumMode ? (
                  // Mode Gratuit (Synthèse vocale locale) - Toujours prêt
                  <>
                    <Slider
                      value={[progress]}
                      max={100}
                      step={0.1}
                      onValueChange={handleTimelineChange}
                      className="w-full cursor-pointer h-2"
                    />
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span className="font-semibold text-primary">
                        Paragraphe {currentParagraphIndex + 1} sur {paragraphs.length}
                      </span>
                      <span className="italic opacity-80">Voix de l'appareil (Gratuit)</span>
                    </div>
                  </>
                ) : (
                  // Mode Premium (VPS) - Dépend de la génération
                  <>
                    {currentAudioFile ? (
                      <>
                        <div className="flex items-center justify-between text-[11px] font-medium bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 px-3 py-1.5 rounded-lg mb-2">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">🎙️ Narration Studio :</span>
                            <span className="truncate">Voix de {customVoices.find(v => v.id === currentAudioFile.voice_id)?.relation || 'Papa'}</span>
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[10px] bg-emerald-600 text-white font-semibold px-2 py-0.5 rounded-full hidden xs:inline-block">
                              Prêt ✅
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleForceRegenerate}
                              disabled={isGenerating || !!currentPendingAudioFile}
                              className="h-6 text-[10px] px-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20 font-semibold flex items-center gap-1"
                              title="Re-créer l'histoire avec la voix actuellement sélectionnée"
                            >
                              <RefreshCw className={cn("w-3 h-3", (isGenerating || !!currentPendingAudioFile) && "animate-spin")} />
                              <span>Re-générer</span>
                            </Button>
                          </div>
                        </div>
                        <Slider
                          value={[progress]}
                          max={100}
                          step={0.1}
                          onValueChange={handleTimelineChange}
                          className="w-full cursor-pointer h-2"
                        />
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                            Livre Audio Multi-Voix Studio
                          </span>
                          <span className="font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                      </>
                    ) : (
                      <div>
                        {isCheckingAudioStatus ? (
                          <div className="text-xs py-3 px-4 text-center text-muted-foreground bg-muted/30 rounded-xl border border-primary/10 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            <span>Vérification du statut du livre audio Studio…</span>
                          </div>
                        ) : (currentPendingAudioFile || isGenerating) ? (
                          <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-amber-500/5 dark:from-amber-950/50 dark:via-purple-950/40 dark:to-slate-900/70 p-3 shadow-sm text-left transition-all">
                            <div className="flex items-start gap-2.5">
                              <div className="relative flex-shrink-0 mt-0.5">
                                <div className="w-7 h-7 rounded-full bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300">
                                  <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                              </div>

                              <div className="flex-1 space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                    <span>🎙️ Production du Livre Audio en cours…</span>
                                  </h4>
                                  <Badge variant="outline" className="text-[9px] bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 px-1.5 py-0 font-medium">
                                    Arrière-plan actif
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                                  L'IA produit la narration multi-voix sur notre serveur. <strong className="text-amber-900 dark:text-amber-100 font-semibold">Vous pouvez quitter cette page ou l'application</strong>, l'audio apparaîtra automatiquement dès sa finalisation.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs py-2.5 px-3 text-center text-muted-foreground bg-muted/40 rounded-lg border border-primary/10">
                            <div className="flex flex-col items-center gap-1.5 py-1">
                              <span className="text-[11px] text-muted-foreground font-medium">
                                Livre audio multi-voix pas encore généré pour ce conte.
                              </span>
                              {selectedVoiceId === 'local' && (
                                <Button 
                                  onClick={handlePlayPause} 
                                  disabled={isGenerating}
                                  size="sm" 
                                  className="h-7 text-[10px] px-3 font-semibold"
                                >
                                  {isGenerating ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                      Lancement de la création…
                                    </>
                                  ) : (
                                    "Générer le livre audio multi-voix"
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Narrator Controls Panel (Fixe en bas : Rewind, Play/Pause, Fast Forward, Download) */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-200/80 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRewind}
                  disabled={currentParagraphIndex === 0}
                  className="h-9 w-9 rounded-full hover:bg-muted"
                  title="Paragraphe précédent"
                >
                  <RotateCcw className="h-4.5 w-4.5" />
                </Button>

                <Button
                  onClick={handlePlayPause}
                  disabled={isGenerating || (isPremiumMode && !!currentPendingAudioFile)}
                  className={cn(
                    "h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-105 shrink-0",
                    isDarkMode 
                      ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                      : "bg-primary text-primary-foreground hover:bg-primary/95"
                  )}
                >
                  {isGenerating || (isPremiumMode && currentPendingAudioFile) ? (
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
                  ) : (
                    <Play className="h-5 w-5 sm:h-6 sm:w-6 ml-0.5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFastForward}
                  disabled={currentParagraphIndex === paragraphs.length - 1}
                  className="h-9 w-9 rounded-full hover:bg-muted"
                  title="Paragraphe suivant"
                >
                  <RotateCw className="h-4.5 w-4.5" />
                </Button>
              </div>

              {/* Offline caching indicators and downloads */}
              <div className="flex items-center gap-2">
                {isPremiumMode && currentAudioFile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      const url = await getSignedAudioUrl(currentAudioFile.audio_url!);
                      if (url) window.open(url, '_blank');
                    }}
                    className="h-8 w-8 rounded-lg"
                    title="Télécharger l'audio en .mp3"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}

                {/* Status information badge */}
                {isPremiumMode && isOfflineReady && (
                  <div className="flex items-center gap-1 text-[10px] text-green-500 font-semibold px-2 bg-green-500/5 rounded-full border border-green-500/10">
                    <Check className="w-3 h-3" /> Dispo hors-ligne 🛌
                  </div>
                )}
                {isCaching && (
                  <div className="text-[10px] text-muted-foreground animate-pulse">
                    Mise en cache...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default IntegratedAudioDeck;

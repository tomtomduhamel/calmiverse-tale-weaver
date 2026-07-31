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

  // Premium audio checking
  const canUsePremiumAudio = limits?.has_multivoice_audio ?? false;
  const preferredAudioMode = userSettings.readingPreferences?.audioMode ?? 'browser';
  const isPremiumMode = (preferredAudioMode === 'premium' && canUsePremiumAudio);

  // Background Sound Hook
  const backgroundSound = useBackgroundSound({
    soundId,
    storyObjective: extractObjectiveValue(objective) || undefined,
    autoPlay: false
  });

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
        await fetchAudioFiles(storyId);

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
            const readyFile = audioFiles.find(f => f.status === 'ready' && f.audio_url && f.story_id === storyId);
            if (readyFile && readyFile.voice_id && readyFile.voice_id !== 'local') {
              setSelectedVoiceId(readyFile.voice_id);
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
  const currentAudioFile = audioFiles.find(
    file => file.status === 'ready' && file.audio_url && (file.text_content === currentParagraphText || file.story_id === storyId)
  );
  const currentPendingAudioFile = audioFiles.find(
    file => (file.status === 'pending' || file.status === 'processing') && (file.story_id === storyId)
  );

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
    
    const speed = userSettings.readingPreferences?.readingSpeed || 1.0;
    utterance.rate = speed;

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

  // Control Play/Pause (Priorité absolue aux fichiers audio Studio prêts)
  const handlePlayPause = async () => {
    // 1. Chercher un fichier binaire Studio prêt pour cette histoire (ex: Voix de Papa)
    const targetReadyFile = audioFiles.find(
      file => file.status === 'ready' && file.audio_url && file.story_id === storyId
    );

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
          if (!signedUrl) throw new Error("Impossible d'obtenir l'URL du fichier audio");
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

        const speed = userSettings.readingPreferences?.readingSpeed || 1.0;
        audio.playbackRate = speed;

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
        audio.onerror = () => {
          toast({
            title: "Erreur audio",
            description: "Impossible de lire le fichier audio Studio",
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
      }
      return;
    }

    // 2. Si aucun fichier Studio n'est prêt et que la voix locale est sélectionnée : lire avec la synthèse vocale de l'appareil (Gratuit)
    if (selectedVoiceId === 'local' || !isPremiumMode) {
      if (!synthRef.current) return;

      if (isBrowserSpeaking) {
        if (isBrowserPaused) {
          synthRef.current.resume();
          setIsBrowserPaused(false);
          setIsPlaying(true);
        } else {
          synthRef.current.pause();
          setIsBrowserPaused(true);
          setIsPlaying(false);
        }
      } else {
        playBrowserParagraph(currentParagraphIndex);
      }
      return;
    }

    // 3. Si l'utilisateur a choisi une voix Premium et qu'aucune génération n'est prête
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
        "fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:w-[600px] md:-translate-x-1/2",
        "backdrop-blur-2xl border rounded-2xl shadow-floating z-[90] transition-all duration-500 overflow-hidden",
        isDarkMode 
          ? "bg-gray-900/[0.96] border-white/10 text-white" 
          : "bg-white/[0.96] border-primary-soft/30 text-gray-800",
        isExpanded ? "p-5 max-h-[400px]" : "p-3 max-h-[70px] flex items-center justify-between"
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
              <p className="text-xs font-semibold tracking-wide uppercase opacity-70">
                {isPremiumMode ? "🌟 Audio Premium" : "🔊 Audio Gratuit"}
              </p>
              <h4 className="text-sm font-bold truncate">
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

          <div className="flex items-center gap-2 shrink-0 ml-4">
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
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}

      {/* 🔴 EXPANDED VIEW */}
      {isExpanded && (
        <div className="space-y-4 w-full flex flex-col">
          {/* Header Panel */}
          <div className="flex justify-between items-center pb-2 border-b border-white/10 dark:border-white/5">
            <div>
              <h3 className="font-display font-semibold italic text-base">Contrôles Audio</h3>
              <p className="text-xs text-muted-foreground">
                Ajustez la voix et la musique de fond
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="h-7 w-7 rounded-full"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>

          {/* Selector block (Narrator voices & Background Music) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-2">
            {/* Colonne 1 : Voix du Narrateur Principal */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                🎙️ Voix du Narrateur Principal
              </label>
              <select
                value={selectedVoiceId}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className={cn(
                  "w-full text-xs font-medium rounded-lg p-2.5 border focus:outline-none focus:ring-1 transition-all",
                  isDarkMode 
                    ? "bg-gray-800 border-gray-700 text-white focus:ring-primary focus:border-primary" 
                    : "bg-white border-primary-soft/50 text-gray-800 focus:ring-primary focus:border-primary"
                )}
              >
                <option value="local">🔊 Voix de l'appareil (Gratuit)</option>
                {customVoices.length > 0 && (
                  <optgroup label="Vos voix de narration (Studio)">
                    {customVoices.map((voice) => {
                      const hasReadyAudio = audioFiles.some(f => f.status === 'ready' && f.voice_id === voice.id && f.story_id === storyId);
                      return (
                        <option key={voice.id} value={voice.id}>
                          🎙️ Narrateur : Voix de {voice.relation} {hasReadyAudio ? '✅ (Prêt à l\'écoute)' : ''}
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

              {/* Mention d'attribution automatique multi-voix pour les personnages */}
              {selectedVoiceId !== 'local' && (
                <div className="bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 p-2 rounded-lg text-[11px] space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-300">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    <span>Multi-Voix Automatique Actif</span>
                  </div>
                  <p className="text-[10px] opacity-90 leading-tight">
                    Les répliques et dialogues des personnages seront automatiquement interprétés par vos autres voix clonées.
                  </p>
                </div>
              )}

              {/* Bouton explicite pour générer/re-générer l'histoire avec cette voix de narrateur */}
              {selectedVoiceId !== 'local' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleForceRegenerate}
                  disabled={isGenerating || !!currentPendingAudioFile}
                  className="w-full text-xs font-semibold h-7.5 mt-1 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex items-center justify-center gap-1.5 transition-all"
                >
                  {isGenerating || currentPendingAudioFile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Création de la narration en cours…</span>
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

            {/* Colonne 2 : Musique de fond */}
            {soundId && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
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
                <div className="flex items-center gap-3 pt-1">
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

          {/* Barre de Progression / Statut de Lecture */}
          <div className="space-y-2 py-1">
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
                      <span className="flex items-center gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">🎙️ Narration Studio :</span>
                        <span>Voix de {customVoices.find(v => v.id === currentAudioFile.voice_id)?.relation || 'Papa'}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] bg-emerald-600 text-white font-semibold px-2 py-0.5 rounded-full">
                          Prêt à l'écoute ✅
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
                      <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-amber-500/5 dark:from-amber-950/50 dark:via-purple-950/40 dark:to-slate-900/70 p-3.5 shadow-sm text-left transition-all">
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0 mt-0.5">
                            <div className="w-8 h-8 rounded-full bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300">
                              <Sparkles className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                            </span>
                          </div>

                          <div className="flex-1 space-y-1">
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
                          <span className="text-[11px] text-muted-foreground">
                            Livre audio multi-voix pour ce conte non généré.
                          </span>
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
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Narrator Controls Panel (Rewind, Play/Pause, Fast Forward, Volume/Speed) */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-4">
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
                  "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-105 shrink-0",
                  isDarkMode 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-primary text-primary-foreground hover:bg-primary/95"
                )}
              >
                {isGenerating || (isPremiumMode && currentPendingAudioFile) ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-0.5" />
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
                  title="Télécharger ce paragraphe en .mp3"
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

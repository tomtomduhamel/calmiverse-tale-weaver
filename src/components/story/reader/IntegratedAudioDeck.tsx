import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX,
  Music, Sliders, ChevronUp, ChevronDown, Check, Loader2, Sparkles, Download
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
  const canUsePremiumAudio = (limits?.audio_generations_per_month ?? 0) > 0;
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
    recoverErrorFiles
  } = useN8nAudioGeneration();

  // Load voices & files
  useEffect(() => {
    synthRef.current = window.speechSynthesis;

    const loadData = async () => {
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
          
          // Initialiser la voix sélectionnée selon les préférences et les autorisations
          if (canUsePremiumAudio && preferredAudioMode === 'premium' && data.length > 0) {
            setSelectedVoiceId(data[0].id);
          } else {
            setSelectedVoiceId('local');
          }
        }
      } catch (err) {
        console.error('Error fetching custom voices:', err);
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

  // Find audio file for the current paragraph
  const currentParagraphText = paragraphs[currentParagraphIndex] || '';
  const currentAudioFile = audioFiles.find(
    file => file.text_content === currentParagraphText && file.voice_id === selectedVoiceId && file.status === 'ready' && file.audio_url
  );
  const currentPendingAudioFile = audioFiles.find(
    file => file.text_content === currentParagraphText && file.voice_id === selectedVoiceId && (file.status === 'pending' || file.status === 'processing')
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

  // Background prefetching for the NEXT paragraph
  useEffect(() => {
    const prefetchNextParagraph = async () => {
      if (!isPremiumMode || !isPlaying) return;
      const nextIndex = currentParagraphIndex + 1;
      if (nextIndex < paragraphs.length) {
        const nextText = paragraphs[nextIndex];
        const nextAudioFile = audioFiles.find(
          file => file.text_content === nextText && file.voice_id === selectedVoiceId
        );
        if (!nextAudioFile) {
          console.log(`🚀 [AudioDeck] Prefetching paragraph ${nextIndex + 1}/${paragraphs.length} in background`);
          await generateAudio(storyId, nextText, selectedVoiceId);
        }
      }
    };
    prefetchNextParagraph();
  }, [currentParagraphIndex, isPlaying, audioFiles, selectedVoiceId, isPremiumMode, storyId, paragraphs]);

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
        description: "Abonnez-vous à Calmidium, Calmix ou Calmixxl pour débloquer le clonage vocal et les voix haute-fidélité.",
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
  };

  // Play/Pause control
  const handlePlayPause = async () => {
    if (isPremiumMode) {
      // 🌟 Premium Audio Playback (VPS/MP3 - Paragraph Chunking)
      if (paragraphs.length === 0) return;
      
      const pText = paragraphs[currentParagraphIndex];
      const pAudioFile = audioFiles.find(
        file => file.text_content === pText && file.voice_id === selectedVoiceId
      );

      if (!pAudioFile || pAudioFile.status === 'error') {
        // Not generated yet, trigger generation
        toast({
          title: "Préparation de la lecture",
          description: "La synthèse vocale haute-fidélité démarre...",
        });
        const generatedId = await generateAudio(storyId, pText, selectedVoiceId);
        if (generatedId) {
          // Immediately trigger play by fetching latest files
          await fetchAudioFiles(storyId);
        }
        return;
      }

      if (pAudioFile.status === 'pending' || pAudioFile.status === 'processing') {
        toast({
          title: "Lecture en cours de préparation",
          description: "Veuillez patienter quelques instants...",
        });
        return;
      }

      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      try {
        let audioUrl = "";
        const cacheKey = `${storyId}_p_${currentParagraphIndex}`;
        const cachedBlob = await audioCache.get(cacheKey);

        if (cachedBlob) {
          audioUrl = URL.createObjectURL(cachedBlob);
          console.log("⚡ [AudioDeck] Playing paragraph from IndexedDB cache");
        } else {
          if (!navigator.onLine) {
            toast({
              title: "Hors-ligne",
              description: "Cet audio premium n'est pas disponible hors-ligne. Activez la mise en cache.",
              variant: "destructive"
            });
            return;
          }
          const signedUrl = await getSignedAudioUrl(pAudioFile.audio_url!);
          if (!signedUrl) throw new Error("Could not get signed URL");
          audioUrl = signedUrl;

          // Cache in background for offline use
          audioCache.prefetchAndCache(cacheKey, signedUrl).then(() => {
            console.log(`✅ [AudioDeck] Cached paragraph ${currentParagraphIndex}`);
            setIsOfflineReady(true);
          }).catch(err => {
            console.error('[AudioDeck] Cache error:', err);
          });
        }

        const audio = audioRef.current || new Audio();
        audio.src = audioUrl;
        audioRef.current = audio;

        const speed = userSettings.readingPreferences?.readingSpeed || 1.0;
        audio.playbackRate = speed;

        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
        };
        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
          setProgress((audio.currentTime / audio.duration) * 100);
        };
        audio.onended = () => {
          // Play next paragraph automatically!
          const nextIndex = currentParagraphIndex + 1;
          if (nextIndex < paragraphs.length) {
            setCurrentParagraphIndex(nextIndex);
            setAutoplayNext(true);
          } else {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);
            setCurrentParagraphIndex(0);
          }
        };
        audio.onerror = () => {
          toast({
            title: "Erreur audio",
            description: "Impossible de lire le fichier audio",
            variant: "destructive"
          });
          setIsPlaying(false);
        };

        // Resume at current time if paused
        if (currentTime > 0 && currentTime < duration) {
          audio.currentTime = currentTime;
        }

        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Audio playback error:", err);
      }
    } else {
      // 🔊 Free Browser SpeechSynthesis Playback (Paragraph-by-Paragraph)
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
    }
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
            {/* Colonne 1 : Voix de lecture */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider opacity-70 flex items-center gap-1.5">
                🎙️ Voix de lecture
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
                  <optgroup label="Vos voix clonées (Premium)">
                    {customVoices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        🎙️ Voix de {voice.relation}
                      </option>
                    ))}
                  </optgroup>
                )}
                {customVoices.length === 0 && (
                  <>
                    {canUsePremiumAudio && (limits?.max_voice_clones ?? 0) > 0 ? (
                      <option value="record_prompt">🎙️ Enregistrer une voix clonée (Premium)</option>
                    ) : (
                      <option value="upgrade_info">🎙️ Cloner la voix d'un proche (Premium 🌟)</option>
                    )}
                  </>
                )}
              </select>
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
                      <span className="font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs py-2 text-center text-muted-foreground bg-muted/40 rounded-lg">
                    {currentPendingAudioFile ? (
                      <div className="flex items-center justify-center gap-2 animate-pulse text-primary font-medium">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Génération de la voix par le VPS... (Prêt dans 30s)
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <span className="text-[11px] text-muted-foreground">
                          Paragraphe {currentParagraphIndex + 1} sur {paragraphs.length} non préparé.
                        </span>
                        <Button 
                          onClick={handlePlayPause} 
                          disabled={isGenerating}
                          size="sm" 
                          className="h-6 text-[10px] px-3 font-semibold"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                              Génération en cours...
                            </>
                          ) : (
                            "Générer l'audio (VPS)"
                          )}
                        </Button>
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

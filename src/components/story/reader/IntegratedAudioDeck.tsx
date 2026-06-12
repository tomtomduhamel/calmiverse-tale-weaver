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
  const [selectedVoiceId, setSelectedVoiceId] = useState('9BWtsMINqrJLrRacOk9x'); // Default ElevenLabs voice (Aria)
  const [provider, setProvider] = useState<string>('elevenlabs');
  
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

      let activeProvider = 'elevenlabs';
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
          
          // Si on utilise le serveur privé et qu'on a des voix, sélectionner la première par défaut
          if (activeProvider === 'vps-hostinger' && data.length > 0) {
            setSelectedVoiceId(data[0].id);
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
      // 🔊 Free Browser SpeechSynthesis Playback
      if (!synthRef.current) return;

      if (isBrowserSpeaking) {
        if (isBrowserPaused) {
          synthRef.current.resume();
          setIsBrowserPaused(false);
        } else {
          synthRef.current.pause();
          setIsBrowserPaused(true);
        }
      } else {
        synthRef.current.cancel(); // Stop any pending
        const cleanText = text.replace(/\[.*?\]/g, ""); // Remove modulation tags
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'fr-FR';
        
        // Find best French voice
        const voices = synthRef.current.getVoices();
        const frVoice = voices.find(v => v.lang.startsWith('fr'));
        if (frVoice) utterance.voice = frVoice;

        utterance.onend = () => {
          setIsBrowserSpeaking(false);
          setIsBrowserPaused(false);
          setProgress(0);
        };
        utterance.onerror = () => {
          setIsBrowserSpeaking(false);
          setIsBrowserPaused(false);
        };

        utteranceRef.current = utterance;
        synthRef.current.speak(utterance);
        setIsBrowserSpeaking(true);
        setIsBrowserPaused(false);
      }
    }
  };

  // Rewind to previous paragraph
  const handleRewind = () => {
    if (isPremiumMode) {
      const prevIndex = currentParagraphIndex - 1;
      if (prevIndex >= 0) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setCurrentParagraphIndex(prevIndex);
        setProgress(0);
        setCurrentTime(0);
        setAutoplayNext(isPlaying); // Autoplay if already playing
      }
    }
  };

  // Fast forward to next paragraph
  const handleFastForward = () => {
    if (isPremiumMode) {
      const nextIndex = currentParagraphIndex + 1;
      if (nextIndex < paragraphs.length) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        setCurrentParagraphIndex(nextIndex);
        setProgress(0);
        setCurrentTime(0);
        setAutoplayNext(isPlaying); // Autoplay if already playing
      }
    }
  };

  // Seeking on the timeline for current paragraph
  const handleTimelineChange = (values: number[]) => {
    if (isPremiumMode && audioRef.current && duration > 0) {
      const pct = values[0];
      const targetTime = (pct / 100) * duration;
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      setProgress(pct);
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
    if (isPremiumMode) {
      const custom = customVoices.find(v => v.id === selectedVoiceId);
      if (custom) return `Voix : ${custom.name} (${custom.relation})`;
      return "Voix Haute-Fidélité";
    }
    return "Synthèse Vocale Locale (Gratuite)";
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
              disabled={isGenerating || !!currentPendingAudioFile}
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 shrink-0",
                isDarkMode ? "bg-primary/20 text-primary-soft hover:bg-primary/30" : "bg-primary-soft/30 text-primary hover:bg-primary-soft/50"
              )}
            >
              {isGenerating || currentPendingAudioFile ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPremiumMode ? (
                isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />
              ) : (
                isBrowserSpeaking && !isBrowserPaused ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />
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
                Ajustez le volume et le narrateur de votre histoire
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAudioMode}
                className="text-[10px] h-7 px-2 font-semibold tracking-wider uppercase flex items-center gap-1 border-primary/20 text-primary hover:bg-primary/10"
              >
                <Sparkles className="w-3 h-3 text-[#E9C46A]" />
                {isPremiumMode ? "Passer en gratuit" : "Débloquer Premium"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="h-7 w-7 rounded-full"
              >
                <ChevronDown className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Selector block (Narrator voices) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Voix du Conteur
              </label>
              <select
                disabled={!isPremiumMode}
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
                className={cn(
                  "w-full text-xs font-medium rounded-lg p-2 border",
                  isDarkMode 
                    ? "bg-gray-800 border-gray-700 text-white focus:ring-primary" 
                    : "bg-white border-primary-soft/50 text-gray-800 focus:ring-primary",
                  !isPremiumMode && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* Custom Cloned Voices Group */}
                {customVoices.length > 0 && (
                  <optgroup label="Vos Voix Enregistrées">
                    {customVoices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        🎙️ {voice.name} ({voice.relation})
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* Stock voices - Uniquement si ce n'est pas le serveur privé */}
                {provider !== 'vps-hostinger' && (
                  <optgroup label="Voix Haute-Fidélité standard">
                    <option value="9BWtsMINqrJLrRacOk9x">Aria (Féminine)</option>
                    <option value="EXAVITQu4vr4xnSDxMaL">Sarah (Féminine)</option>
                    <option value="IKne3meq5aSn9XLyUdCD">Charlie (Masculine)</option>
                    <option value="onwK4e9ZLuTAKqWW03F9">Daniel (Masculine)</option>
                  </optgroup>
                )}
              </select>
              {!isPremiumMode && (
                <p className="text-[10px] text-primary mt-1 font-semibold flex items-center gap-0.5 animate-pulse">
                  <Sparkles className="w-2.5 h-2.5" /> Activez le mode Premium pour enregistrer votre voix.
                </p>
              )}
              {isPremiumMode && provider === 'vps-hostinger' && customVoices.length === 0 && (
                <p className="text-[10px] text-primary mt-1 font-semibold">
                  💡 Enregistrez d'abord une voix dans le Studio des Voix Familiales pour utiliser la lecture haute-fidélité.
                </p>
              )}
            </div>

            {/* Background Sound controls */}
            {soundId && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Music className="w-3.5 h-3.5 text-primary" /> Musique de fond
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={backgroundSound.togglePlay}
                    className={cn(
                      "h-5 text-[10px] px-1.5 rounded",
                      backgroundSound.isPlaying 
                        ? "text-primary bg-primary-soft/20 font-bold" 
                        : "text-muted-foreground"
                    )}
                  >
                    {backgroundSound.isPlaying ? "Active" : "Désactivée"}
                  </Button>
                </div>
                <div className="flex items-center gap-2 pt-1.5">
                  <VolumeX className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <Slider
                    disabled={!backgroundSound.isPlaying}
                    value={[backgroundSound.volume]}
                    max={1}
                    step={0.05}
                    onValueChange={handleMusicVolumeChange}
                    className="flex-1 cursor-pointer"
                  />
                  <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </div>
              </div>
            )}
          </div>

          {/* Timeline and timeline controls */}
          <div className="space-y-1.5">
            {isPremiumMode ? (
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
                        Phrase {currentParagraphIndex + 1} sur {paragraphs.length}
                      </span>
                      <span className="font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs py-2 text-center text-muted-foreground bg-muted/40 rounded-lg">
                    {currentPendingAudioFile ? (
                      <div className="flex items-center justify-center gap-2 animate-pulse text-primary">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Préparation de la lecture haute-fidélité... (Prêt dans 30s)
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <span className="text-[11px] text-muted-foreground">
                          Phrase {currentParagraphIndex + 1} sur {paragraphs.length} non préparée.
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
                              Préparation...
                            </>
                          ) : (
                            "Préparer cette phrase"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-[10px] text-center p-2 rounded-lg bg-muted/40 text-muted-foreground">
                💡 Mode Gratuit : Lecture par synthèse locale. Pour avancer de 10s ou naviguer dans le temps, activez l'Audio Premium.
              </div>
            )}
          </div>

          {/* Narrator Controls Panel (Rewind, Play/Pause, Fast Forward, Volume/Speed) */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRewind}
                disabled={!isPremiumMode || currentParagraphIndex === 0}
                className="h-9 w-9 rounded-full hover:bg-muted"
                title="Phrase précédente"
              >
                <RotateCcw className="h-4.5 w-4.5" />
              </Button>

              <Button
                onClick={handlePlayPause}
                disabled={isGenerating || !!currentPendingAudioFile}
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-105 shrink-0",
                  isDarkMode 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-primary text-primary-foreground hover:bg-primary/95"
                )}
              >
                {isGenerating || currentPendingAudioFile ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isPremiumMode ? (
                  isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />
                ) : (
                  isBrowserSpeaking && !isBrowserPaused ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleFastForward}
                disabled={!isPremiumMode || currentParagraphIndex === paragraphs.length - 1}
                className="h-9 w-9 rounded-full hover:bg-muted"
                title="Phrase suivante"
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
                  title="Télécharger cette phrase en .mp3"
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

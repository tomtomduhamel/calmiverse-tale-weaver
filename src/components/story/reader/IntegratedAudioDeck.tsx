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

      // Fetch custom user voices
      try {
        const { data, error } = await supabase
          .from('user_voices')
          .select('id, name, relation, voice_ref_path, transcript');
        if (!error && data) {
          setCustomVoices(data as CustomVoice[]);
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

  const readyAudioFile = audioFiles.find(file => file.status === 'ready' && file.audio_url);
  const pendingAudioFile = audioFiles.find(file => file.status === 'pending' || file.status === 'processing');

  // Cache prefetching for premium offline use
  useEffect(() => {
    const prefetchAudio = async () => {
      if (readyAudioFile?.audio_url && isPremiumMode) {
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
          console.error('[AudioDeck] Cache prefetch error:', error);
        } finally {
          setIsCaching(false);
        }
      } else {
        setIsOfflineReady(false);
      }
    };

    prefetchAudio();
  }, [readyAudioFile?.audio_url, storyId, isPremiumMode]);

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
          ? "Vous écoutez les voix haute fidélité générées par IA" 
          : "Vous utilisez le synthétiseur gratuit de votre appareil"
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Play/Pause control
  const handlePlayPause = async () => {
    if (isPremiumMode) {
      // 🌟 Premium Audio Playback (VPS/MP3)
      if (!readyAudioFile?.audio_url) {
        // Not generated yet, trigger generation
        toast({
          title: "Génération audio lancée",
          description: "La synthèse vocale haute-fidélité démarre...",
        });
        await generateAudio(storyId, text, selectedVoiceId);
        return;
      }

      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      try {
        let audioUrl = "";
        const cachedBlob = await audioCache.get(storyId);

        if (cachedBlob) {
          audioUrl = URL.createObjectURL(cachedBlob);
          console.log("⚡ [AudioDeck] Playing from IndexedDB offline cache");
        } else {
          if (!navigator.onLine) {
            toast({
              title: "Hors-ligne",
              description: "Cet audio premium n'est pas disponible hors-ligne. Activez la mise en cache.",
              variant: "destructive"
            });
            return;
          }
          const signedUrl = await getSignedAudioUrl(readyAudioFile.audio_url);
          if (!signedUrl) throw new Error("Could not get signed URL");
          audioUrl = signedUrl;
        }

        const audio = audioRef.current || new Audio();
        audio.src = audioUrl;
        audioRef.current = audio;

        // Set speed (if settings have speeds)
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
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime(0);
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
        const cleanText = text.replace(/\[.*?\]/g, ""); // Remove n8n tags
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

  // 10 seconds rewind
  const handleRewind = () => {
    if (isPremiumMode && audioRef.current) {
      const targetTime = Math.max(0, audioRef.current.currentTime - 10);
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  // 10 seconds skip forward
  const handleFastForward = () => {
    if (isPremiumMode && audioRef.current) {
      const targetTime = Math.min(duration, audioRef.current.currentTime + 10);
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  // Scrubbing/seeking on timeline
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
      if (custom) return `Clone : ${custom.name} (${custom.relation})`;
      return "Voix Haute-Fidélité IA";
    }
    return "Synthèse Vocale Locale (Gratuite)";
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:w-[600px] md:-translate-x-1/2",
        "backdrop-blur-xl border rounded-2xl shadow-floating z-[90] transition-all duration-500 overflow-hidden",
        isDarkMode 
          ? "bg-gray-900/80 border-white/10 text-white" 
          : "bg-white/85 border-primary-soft/30 text-gray-800",
        isExpanded ? "p-5 max-h-[400px]" : "p-3 max-h-[70px] flex items-center justify-between"
      )}
    >
      {/* 🟢 COLLAPSED VIEW */}
      {!isExpanded && (
        <>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              onClick={handlePlayPause}
              disabled={isGenerating || !!pendingAudioFile}
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 shrink-0",
                isDarkMode ? "bg-primary/20 text-primary-soft hover:bg-primary/30" : "bg-primary-soft/30 text-primary hover:bg-primary-soft/50"
              )}
            >
              {isGenerating || pendingAudioFile ? (
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
                  <optgroup label="Vos Clones Vocaux (Premium)">
                    {customVoices.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        🎙️ {voice.name} ({voice.relation})
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* Stock voices */}
                <optgroup label="Voix Haute-Fidélité standard">
                  <option value="9BWtsMINqrJLrRacOk9x">Aria (Féminine)</option>
                  <option value="EXAVITQu4vr4xnSDxMaL">Sarah (Féminine)</option>
                  <option value="IKne3meq5aSn9XLyUdCD">Charlie (Masculine)</option>
                  <option value="onwK4e9ZLuTAKqWW03F9">Daniel (Masculine)</option>
                </optgroup>
              </select>
              {!isPremiumMode && (
                <p className="text-[10px] text-primary mt-1 font-semibold flex items-center gap-0.5 animate-pulse">
                  <Sparkles className="w-2.5 h-2.5" /> Activez le mode Premium pour cloner votre voix.
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
                {readyAudioFile ? (
                  <>
                    <Slider
                      value={[progress]}
                      max={100}
                      step={0.1}
                      onValueChange={handleTimelineChange}
                      className="w-full cursor-pointer h-2"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-xs py-2 text-center text-muted-foreground bg-muted/40 rounded-lg">
                    {pendingAudioFile ? (
                      <div className="flex items-center justify-center gap-2 animate-pulse text-primary">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Génération vocale en cours par votre VPS... (Prêt dans 30s)
                      </div>
                    ) : (
                      "Générez d'abord la lecture haute-fidélité pour accéder au lecteur complet."
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
                disabled={!isPremiumMode || !readyAudioFile}
                className="h-9 w-9 rounded-full hover:bg-muted"
                title="Reculer de 10s"
              >
                <RotateCcw className="h-4.5 w-4.5" />
              </Button>

              <Button
                onClick={handlePlayPause}
                disabled={isGenerating || !!pendingAudioFile}
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-105 shrink-0",
                  isDarkMode 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : "bg-primary text-primary-foreground hover:bg-primary/95"
                )}
              >
                {isGenerating || pendingAudioFile ? (
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
                disabled={!isPremiumMode || !readyAudioFile}
                className="h-9 w-9 rounded-full hover:bg-muted"
                title="Avancer de 10s"
              >
                <RotateCw className="h-4.5 w-4.5" />
              </Button>
            </div>

            {/* Offline caching indicators and downloads */}
            <div className="flex items-center gap-2">
              {isPremiumMode && readyAudioFile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    const url = await getSignedAudioUrl(readyAudioFile.audio_url);
                    if (url) window.open(url, '_blank');
                  }}
                  className="h-8 w-8 rounded-lg"
                  title="Télécharger l'histoire en .mp3"
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

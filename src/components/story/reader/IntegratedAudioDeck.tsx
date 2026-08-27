import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX,
  Moon, Check, Loader2, Sparkles, Download, RefreshCw, ChevronDown, User
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  onPlayStateChange?: (isPlaying: boolean) => void;
}

interface CustomVoice {
  id: string;
  name: string;
  relation: string;
  category?: string;
  category_name?: string | null;
  voice_ref_path: string;
  transcript: string | null;
}

export const IntegratedAudioDeck: React.FC<IntegratedAudioDeckProps> = ({
  storyId,
  text,
  soundId,
  objective,
  isDarkMode = false,
  onPlayStateChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('local');
  const [isVoicePopoverOpen, setIsVoicePopoverOpen] = useState(false);
  const [isSoundPopoverOpen, setIsSoundPopoverOpen] = useState(false);
  const navigate = useNavigate();

  // Browser SpeechSynthesis state
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Synchroniser l'état actif audio avec le parent (assombrissement d'écran / veilleuse)
  useEffect(() => {
    const active = isPlaying || isBrowserSpeaking;
    onPlayStateChange?.(active);
  }, [isPlaying, isBrowserSpeaking, onPlayStateChange]);

  useEffect(() => {
    return () => {
      onPlayStateChange?.(false);
    };
  }, [onPlayStateChange]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
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

  const canUsePremiumAudio = limits?.has_multivoice_audio ?? false;
  const preferredAudioMode = userSettings.readingPreferences?.audioMode ?? 'browser';

  // Audio file checks
  const readyStoryAudioFile = audioFiles.find(
    file => file.status === 'ready' && file.audio_url && file.story_id === storyId
  );
  const currentPendingAudioFile = audioFiles.find(
    file => (file.status === 'pending' || file.status === 'processing') && file.story_id === storyId
  );
  const isPremiumMode = (preferredAudioMode === 'premium' && canUsePremiumAudio && selectedVoiceId !== 'local') || !!readyStoryAudioFile;

  // Background Sound Hook
  const backgroundSound = useBackgroundSound({
    soundId,
    storyObjective: extractObjectiveValue(objective) || undefined,
    autoPlay: false
  });

  // 1. Souscription Realtime
  useEffect(() => {
    if (!storyId) return;
    const cleanup = subscribeToAudioFiles(storyId);
    return () => {
      if (cleanup) cleanup();
    };
  }, [storyId, subscribeToAudioFiles]);

  // 2. Écoute du défilement de lecture (Scroll Event Listener)
  useEffect(() => {
    const findAndAttachViewport = () => {
      const viewport = document.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      if (!viewport) return null;

      const handleScroll = () => {
        const scrollTop = viewport.scrollTop;
        const maxScroll = viewport.scrollHeight - viewport.clientHeight;
        if (maxScroll > 0) {
          const pct = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
          setReadingProgress(pct);
        }
      };

      viewport.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
      return () => viewport.removeEventListener('scroll', handleScroll);
    };

    const cleanup = findAndAttachViewport();
    return () => {
      if (cleanup) cleanup();
    };
  }, [storyId]);

  // 3. Chargement des voix et fichiers audio
  useEffect(() => {
    synthRef.current = window.speechSynthesis;

    const loadData = async () => {
      try {
        await cleanupStuckFiles(storyId);
        await recoverErrorFiles(storyId);
        const fetchedFiles = await fetchAudioFiles(storyId);

        // Fetch custom user voices
        try {
          const { data, error } = await supabase
            .from('user_voices')
            .select('id, name, relation, category, category_name, voice_ref_path, transcript');
          if (!error && data) {
            const allVoices = data as CustomVoice[];
            setCustomVoices(allVoices);
            
            const narrators = allVoices.filter(
              v => (v.category || 'narrator_family') === 'narrator_family' || v.category?.startsWith('narrator')
            );
            
            const readyFile = fetchedFiles.find(f => f.status === 'ready' && f.audio_url && f.story_id === storyId);
            if (readyFile) {
              const matchingVoiceId = (readyFile.voice_id && readyFile.voice_id !== 'local')
                ? readyFile.voice_id
                : (narrators.length > 0 ? narrators[0].id : 'local');
              setSelectedVoiceId(matchingVoiceId);
            } else if (canUsePremiumAudio && preferredAudioMode === 'premium' && narrators.length > 0) {
              setSelectedVoiceId(narrators[0].id);
            } else {
              setSelectedVoiceId('local');
            }
          }
        } catch (err) {
          console.error('Error fetching custom voices:', err);
        }
      } catch (err) {
        console.error('Error initializing audio deck:', err);
      }
    };

    loadData();

    return () => {
      if (synthRef.current) synthRef.current.cancel();
      if (audioRef.current) audioRef.current.pause();
    };
  }, [storyId, fetchAudioFiles, cleanupStuckFiles, recoverErrorFiles]);

  // Split text into sentences for browser speech synthesis fallback
  const paragraphs = React.useMemo(() => {
    if (!text) return [];
    const cleanText = text.replace(/\[.*?\]/g, "").replace(/\s+/g, " ").trim();
    return cleanText.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 0);
  }, [text]);

  const [currentParagraphIndex, setCurrentParagraphIndex] = useState<number>(0);

  // Auto-synchroniser le sélecteur de voix sur l'audio généré disponible
  useEffect(() => {
    if (readyStoryAudioFile) {
      if (readyStoryAudioFile.voice_id && readyStoryAudioFile.voice_id !== 'local') {
        if (selectedVoiceId !== readyStoryAudioFile.voice_id) {
          setSelectedVoiceId(readyStoryAudioFile.voice_id);
        }
      }
    }
  }, [readyStoryAudioFile]);

  // Synthèse vocale du navigateur (Mode Gratuit)
  const playBrowserParagraph = (index: number) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();

    const pText = paragraphs[index];
    if (!pText) {
      setIsPlaying(false);
      setIsBrowserSpeaking(false);
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
        setCurrentParagraphIndex(0);
        setProgress(0);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsBrowserSpeaking(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  // Sélection de la voix
  const handleVoiceChange = (value: string) => {
    setIsVoicePopoverOpen(false);

    if (value === 'studio_redirect') {
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
    }

    setSelectedVoiceId(value);
    const isCustomVoice = value !== 'local';
    updateUserSettings({
      readingPreferences: {
        ...userSettings.readingPreferences,
        audioMode: isCustomVoice ? 'premium' : 'browser'
      }
    });
  };

  // Lancement / Pause de l'audio
  const handlePlayPause = async () => {
    // 1. Si un fichier audio prêt existe, on le lance directement
    if (readyStoryAudioFile?.audio_url) {
      if (isPlaying && audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      if (isBrowserSpeaking && synthRef.current) {
        synthRef.current.cancel();
        setIsBrowserSpeaking(false);
      }

      try {
        let audioUrl = "";
        const cacheKey = `story_${storyId}`;
        const cachedBlob = await audioCache.get(cacheKey);

        if (cachedBlob) {
          audioUrl = URL.createObjectURL(cachedBlob);
        } else {
          const signedUrl = await getSignedAudioUrl(readyStoryAudioFile.audio_url);
          if (!signedUrl) throw new Error("Impossible d'accéder au fichier audio");
          audioUrl = signedUrl;
          audioCache.prefetchAndCache(cacheKey, signedUrl).then(() => {
            setIsOfflineReady(true);
          }).catch(() => {});
        }

        const audio = audioRef.current || new Audio();
        if (audio.src !== audioUrl) {
          audio.src = audioUrl;
        }
        audioRef.current = audio;
        audio.playbackRate = 1.0;

        audio.onloadedmetadata = () => setDuration(audio.duration);
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
            description: "Impossible de lire le fichier.",
            variant: "destructive"
          });
          setIsPlaying(false);
        };

        if (currentTime > 0 && currentTime < duration) {
          audio.currentTime = currentTime;
        }

        await audio.play();
        setIsPlaying(true);
      } catch (err: any) {
        toast({
          title: "Erreur de lecture",
          description: err?.message || "Erreur de lecture audio",
          variant: "destructive"
        });
        setIsPlaying(false);
      }
      return;
    }

    // 2. Si l'audio est déjà en cours de génération
    if (currentPendingAudioFile || isGenerating) {
      return;
    }

    // 3. Si c'est une voix locale gratuite
    if (selectedVoiceId === 'local') {
      if (isBrowserSpeaking && isPlaying) {
        if (synthRef.current) synthRef.current.cancel();
        setIsPlaying(false);
        setIsBrowserSpeaking(false);
      } else {
        playBrowserParagraph(currentParagraphIndex);
      }
      return;
    }

    // 4. Si une voix personnalisée est choisie sans audio généré : lancement fluide en arrière-plan
    await generateAudio(storyId, text, selectedVoiceId);
  };

  // Saut de +/- 10 secondes
  const handleSeekRelative = (deltaSeconds: number) => {
    if (readyStoryAudioFile && audioRef.current && duration > 0) {
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + deltaSeconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setProgress((newTime / duration) * 100);
    } else {
      // Navigation par paragraphe
      const nextIdx = Math.max(0, Math.min(paragraphs.length - 1, currentParagraphIndex + (deltaSeconds > 0 ? 1 : -1)));
      setCurrentParagraphIndex(nextIdx);
      if (isBrowserSpeaking) {
        playBrowserParagraph(nextIdx);
      }
    }
  };

  // Clic sur la barre de progression (Scrubbing / Seeking unifié)
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));

    if (readyStoryAudioFile && audioRef.current && duration > 0) {
      const targetTime = (newPct / 100) * duration;
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
      setProgress(newPct);
    } else {
      // Scroll du lecteur de texte vers cette position
      const viewport = document.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      if (viewport) {
        const maxScroll = viewport.scrollHeight - viewport.clientHeight;
        viewport.scrollTo({ top: (newPct / 100) * maxScroll, behavior: 'smooth' });
        setReadingProgress(newPct);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Seules les voix de la catégorie Narrateurs & Famille sont sélectionnables pour la narration dans le Reader
  const narratorVoices = React.useMemo(() => {
    return customVoices.filter(
      v => (v.category || 'narrator_family') === 'narrator_family' || v.category?.startsWith('narrator')
    );
  }, [customVoices]);

  // Voix active affichée
  const currentVoiceObj = customVoices.find(v => v.id === selectedVoiceId);
  const voiceDisplayName = selectedVoiceId === 'local' 
    ? "Voix standard" 
    : (currentVoiceObj ? (currentVoiceObj.relation || currentVoiceObj.name) : "Voix familiale");

  // Pourcentage affiché sur la barre fine : Audio en priorité si actif, sinon progression de lecture
  const isAudioActive = isPlaying || (readyStoryAudioFile && currentTime > 0);
  const displayProgress = isAudioActive ? progress : readingProgress;
  const isAudioReady = !!readyStoryAudioFile?.audio_url;
  const isAudioProcessing = isGenerating || !!currentPendingAudioFile;

  return (
    <div className="fixed bottom-3 sm:bottom-6 inset-x-0 mx-auto z-40 w-[calc(100%-2rem)] max-w-[608px] pointer-events-none transition-all duration-300">
      <div 
        className={cn(
          "pointer-events-auto relative overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-2xl transition-all duration-300",
          isDarkMode 
            ? "bg-gray-950/90 border-white/15 text-white shadow-black/80" 
            : "bg-white/90 border-primary-soft/35 text-gray-900 shadow-xl"
        )}
      >
        {/* 🌟 1. FINE BARRE DE PROGRESSION UNIFIÉE (3.5 px) */}
        <div 
          ref={progressBarRef}
          onClick={handleProgressBarClick}
          className="group absolute top-0 left-0 right-0 h-[3.5px] bg-muted/40 cursor-pointer hover:h-[6px] transition-all z-10"
          title={isAudioActive ? `Position audio : ${formatTime(currentTime)} / ${formatTime(duration)}` : `Progression de lecture : ${Math.round(readingProgress)}%`}
        >
          <div 
            className={cn(
              "h-full transition-all duration-150 ease-out relative",
              isAudioActive 
                ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400" 
                : "bg-gradient-to-r from-primary/80 to-primary"
            )}
            style={{ width: `${displayProgress}%` }}
          >
            {/* Curseur lumineux au bout de la barre */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* 🌟 2. CONTENUS DE LA CAPSULE ZEN (Hauteur compacte ~52 px) */}
        <div className="h-13 px-3 sm:px-4 flex items-center justify-between gap-2 pt-1">
          
          {/* GAUCHE : SÉLECTEUR DE NARRATEUR DISCRET */}
          <Popover open={isVoicePopoverOpen} onOpenChange={setIsVoicePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8.5 px-2.5 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0 transition-all",
                  isDarkMode 
                    ? "bg-white/5 hover:bg-white/10 text-white border border-white/10" 
                    : "bg-primary-soft/20 hover:bg-primary-soft/40 text-gray-900 border border-primary-soft/30"
                )}
              >
                <span className="text-sm">
                  {selectedVoiceId === 'local' ? "🔊" : "🎙️"}
                </span>
                <span className="max-w-[85px] sm:max-w-[120px] truncate font-sans">
                  {voiceDisplayName}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="start" 
              className="w-64 p-2 rounded-2xl backdrop-blur-2xl shadow-2xl border bg-background/95 text-foreground z-[100]"
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                Choisir le narrateur
              </div>
              <div className="space-y-1 mt-1 max-h-56 overflow-y-auto pr-1">
                {/* Option Gratuite */}
                <button
                  onClick={() => handleVoiceChange('local')}
                  className={cn(
                    "w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors",
                    selectedVoiceId === 'local' 
                      ? "bg-primary/15 text-primary font-semibold" 
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span>🔊</span>
                    <span>Voix de l'appareil (Gratuit)</span>
                  </span>
                  {selectedVoiceId === 'local' && <Check className="w-3.5 h-3.5" />}
                </button>

                {/* Voix de Narrateurs Studio (Famille) */}
                {narratorVoices.map((voice) => {
                  const hasReadyAudio = audioFiles.some(f => f.status === 'ready' && f.voice_id === voice.id && f.story_id === storyId);
                  const isSelected = selectedVoiceId === voice.id;
                  return (
                    <button
                      key={voice.id}
                      onClick={() => handleVoiceChange(voice.id)}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors",
                        isSelected 
                          ? "bg-primary/15 text-primary font-semibold" 
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>🎙️</span>
                        <span className="truncate">{voice.name} ({voice.relation})</span>
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasReadyAudio && <span className="text-[10px] text-emerald-500 font-bold">Prêt</span>}
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}

                {/* Enregistrer une voix de narrateur */}
                <button
                  onClick={() => handleVoiceChange('studio_redirect')}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2 text-primary hover:bg-primary/10 transition-colors border-t border-border/40 mt-1 pt-1.5 font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>+ Enregistrer une voix de narrateur</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>

          {/* CENTRE : BOUTON PRINCIPAL PLAY / PAUSE / CRÉER MAGIQUE */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Recul 10s */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSeekRelative(-10)}
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
              title="Reculer de 10 secondes"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* Bouton Action Principal */}
            {isAudioProcessing ? (
              // En cours de génération : respiration lumineuse
              <div className="h-10 px-3.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center gap-2 animate-pulse text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                <span className="hidden xs:inline">Création…</span>
              </div>
            ) : !isAudioReady && selectedVoiceId !== 'local' ? (
              // Pas encore généré : Bouton Magique "Créer l'audio"
              <Button
                onClick={handlePlayPause}
                className="h-10 px-3.5 rounded-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Créer l'audio</span>
              </Button>
            ) : (
              // Audio Prêt ou Synthèse Locale : Gros Bouton Play / Pause
              <Button
                onClick={handlePlayPause}
                className={cn(
                  "h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:scale-105 shrink-0",
                  isPlaying 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                    : (isAudioReady 
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                        : "bg-primary text-primary-foreground hover:bg-primary/90")
                )}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
            )}

            {/* Avance 10s */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSeekRelative(10)}
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
              title="Avancer de 10 secondes"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          {/* DROITE : AMBIANCE SONORE (🌙) ÉPURÉE */}
          <div className="flex items-center shrink-0">
            {soundId ? (
              <Popover open={isSoundPopoverOpen} onOpenChange={setIsSoundPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (!isSoundPopoverOpen) {
                        backgroundSound.togglePlay();
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setIsSoundPopoverOpen(true);
                    }}
                    className={cn(
                      "h-8.5 w-8.5 rounded-full transition-all",
                      backgroundSound.isPlaying 
                        ? "bg-primary/20 text-primary border border-primary/30 shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                    title={backgroundSound.isPlaying ? "Ambiance sonore active (clic pour couper)" : "Activer l'ambiance sonore"}
                  >
                    <Moon className={cn("w-4 h-4", backgroundSound.isPlaying && "animate-pulse")} />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  side="top" 
                  align="end" 
                  className="w-48 p-3 rounded-2xl backdrop-blur-2xl shadow-2xl border bg-background/95 z-[100]"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span>Volume ambiance</span>
                      <span className="font-mono text-[10px]">{Math.round(backgroundSound.volume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <VolumeX className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <Slider
                        value={[backgroundSound.volume]}
                        max={1}
                        step={0.05}
                        onValueChange={(val) => backgroundSound.setVolume(val[0])}
                        className="flex-1 cursor-pointer"
                      />
                      <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="w-8.5" />
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default IntegratedAudioDeck;

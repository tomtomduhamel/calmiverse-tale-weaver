import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX,
  Moon, Check, Loader2, Sparkles, Download, RefreshCw, ChevronDown, User, Bell
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useN8nAudioGeneration } from '@/hooks/story/audio/useN8nAudioGeneration';
import { useBackgroundSound } from '@/hooks/story/sound/useBackgroundSound';
import { pauseGlobalBackgroundAudio, setOnExternalBgPause } from '@/hooks/story/sound/useRobustAudioPlayer';
import { useUserSettings } from '@/hooks/settings/useUserSettings';
import { useSubscription } from '@/hooks/subscription/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { getSignedAudioUrl } from '@/utils/storageUtils';
import { audioCache, getAudioCacheKey } from '@/utils/audioCache';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { extractObjectiveValue } from '@/utils/objectiveUtils';
import { useNavigate } from 'react-router-dom';
import { soundEffectsEngine, detectContextualSoundEffect } from '@/utils/soundEffectsEngine';

interface IntegratedAudioDeckProps {
  storyId: string;
  text: string;
  soundId?: string | null;
  objective?: string | null;
  isDarkMode?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onPauseScroll?: () => void;
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

// Singleton HTMLAudioElement au niveau module pour empêcher toute instance Audio orpheline en arrière-plan
let globalStoryAudio: HTMLAudioElement | null = null;
let globalPlayingStoryId: string | null = null;
let globalPlayingUrl: string | null = null;

const getGlobalStoryAudio = (): HTMLAudioElement | null => {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  if (!globalStoryAudio) {
    globalStoryAudio = new Audio();
    globalStoryAudio.preload = 'auto';
  }
  return globalStoryAudio;
};

export const IntegratedAudioDeck: React.FC<IntegratedAudioDeckProps> = ({
  storyId,
  text,
  soundId,
  objective,
  isDarkMode = false,
  onPlayStateChange,
  onPauseScroll
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
  const [autoPlayRequested, setAutoPlayRequested] = useState(false);
  const currentPlayingUrlRef = useRef<string | null>(null);
  const navigate = useNavigate();

  // ✨ Sound FX féeriques doux contextuels
  const [isSfxEnabled, setIsSfxEnabled] = useState(true);
  const lastSfxParaIndexRef = useRef<number>(-1);

  // 🌙 Prolongation Dodo (15 min de berceuse après la fin de l'histoire)
  const [isProlongationEnabled, setIsProlongationEnabled] = useState(true);
  const [isProlonging, setIsProlonging] = useState(false);
  const [prolongationSecondsLeft, setProlongationSecondsLeft] = useState(900);
  const prolongationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopProlongation = useCallback(() => {
    if (prolongationTimerRef.current) {
      clearInterval(prolongationTimerRef.current);
      prolongationTimerRef.current = null;
    }
    setIsProlonging(false);
    setProlongationSecondsLeft(900);
  }, []);

  // Browser SpeechSynthesis state
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const browserSpeechCancelledRef = useRef<boolean>(false);

  // Synchroniser l'état actif audio avec le parent (assombrissement d'écran / veilleuse)
  useEffect(() => {
    const active = isPlaying || isBrowserSpeaking;
    onPlayStateChange?.(active);
  }, [isPlaying, isBrowserSpeaking, onPlayStateChange]);

  useEffect(() => {
    return () => {
      onPlayStateChange?.(false);
      stopProlongation();
    };
  }, [onPlayStateChange, stopProlongation]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(getGlobalStoryAudio());
  const isStartingPlaybackRef = useRef<boolean>(false);
  const playbackSessionIdRef = useRef<number>(0);
  const wasBgAutoStartedRef = useRef<boolean>(false);
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

  const canUsePremiumAudio = (limits?.audio_generations_per_month ?? 0) > 0 || (limits?.has_multivoice_audio ?? false);
  const defaultMode = (limits?.has_multivoice_audio) ? 'premium' : 'browser';
  const preferredAudioMode = userSettings.readingPreferences?.audioMode ?? defaultMode;

  // Audio file checks : privilégier l'état en cours s'il existe pour éviter de rejouer un audio obsolète
  const currentPendingAudioFile = audioFiles.find(
    file => (file.status === 'pending' || file.status === 'processing') && file.story_id === storyId
  );
  const readyStoryAudioFile = audioFiles.find(
    file => !currentPendingAudioFile && !isGenerating && file.status === 'ready' && file.audio_url && file.story_id === storyId
  );
  const isPremiumMode = (canUsePremiumAudio && (preferredAudioMode === 'premium' || limits?.has_multivoice_audio) && selectedVoiceId !== 'local') || !!readyStoryAudioFile;

  // Background Sound Hook
  const backgroundSound = useBackgroundSound({
    soundId,
    storyObjective: extractObjectiveValue(objective) || undefined,
    autoPlay: false
  });

  // Coupe-circuit total : arrête immédiatement toute source audio (HTMLAudioElement singleton, DOM <audio>, SpeechSynthesis, Ambiance, AutoScroll)
  const isStoppingPlaybackRef = useRef<boolean>(false);
  const stopAllPlayback = useCallback(() => {
    if (isStoppingPlaybackRef.current) return;
    isStoppingPlaybackRef.current = true;

    try {
      // 1. Invalider toute promesse de démarrage en cours (cache IndexedDB / URL signée)
      playbackSessionIdRef.current += 1;
      isStartingPlaybackRef.current = false;

      // 2. Couper la synthèse vocale navigateur en neutralisant onend (qui sinon relance la phrase suivante sur Android)
      browserSpeechCancelledRef.current = true;
      if (utteranceRef.current) {
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current = null;
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      setIsBrowserSpeaking(false);

      // 3. Mettre en pause le singleton HTMLAudioElement ainsi que tout élément <audio> du document
      if (globalStoryAudio) {
        try {
          globalStoryAudio.pause();
        } catch {}
      }
      if (audioRef.current && audioRef.current !== globalStoryAudio) {
        try {
          audioRef.current.pause();
        } catch {}
      }
      if (typeof document !== 'undefined') {
        document.querySelectorAll('audio').forEach((el) => {
          try {
            el.pause();
          } catch {}
        });
      }

      // 4. Arrêter la prolongation et mettre en pause l'ambiance sonore (sans dépendre d'une closure React périmée)
      stopProlongation();
      pauseGlobalBackgroundAudio();
      if (backgroundSound.isPlaying) {
        backgroundSound.togglePlay();
      }
      wasBgAutoStartedRef.current = false;

      // 5. Mettre en pause le défilement automatique du texte s'il est actif
      onPauseScroll?.();

      // 6. Synchroniser immédiatement l'état React et MediaSession Android/iOS
      setIsPlaying(false);
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        try {
          navigator.mediaSession.playbackState = 'paused';
        } catch {}
      }
    } finally {
      isStoppingPlaybackRef.current = false;
    }
  }, [backgroundSound, onPauseScroll, stopProlongation]);

  const stopAllPlaybackRef = useRef(stopAllPlayback);
  stopAllPlaybackRef.current = stopAllPlayback;

  // Relier toute pause externe (ex: notification Android qui ciblerait la piste d'ambiance) au coupe-circuit principal
  useEffect(() => {
    setOnExternalBgPause(() => {
      stopAllPlaybackRef.current();
    });
    return () => {
      setOnExternalBgPause(null);
    };
  }, []);

  // 🎚️ Audio Ducking Intelligent : lance l'ambiance sonore en sourdine sous la voix dès le clic Play et la coupe en Pause
  useEffect(() => {
    if (isPlaying || isBrowserSpeaking) {
      backgroundSound.setVolume(0.16);
      if (!backgroundSound.isPlaying && (soundId || objective)) {
        wasBgAutoStartedRef.current = true;
        backgroundSound.togglePlay();
      }
    } else if (!isProlonging) {
      if (backgroundSound.isPlaying && wasBgAutoStartedRef.current) {
        wasBgAutoStartedRef.current = false;
        backgroundSound.togglePlay();
      }
      backgroundSound.setVolume(0.40);
    }
  }, [isPlaying, isBrowserSpeaking, isProlonging, soundId, objective]);

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

  // 3. Chargement rapide en parallèle des voix et fichiers audio + rattachement au singleton Audio
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    const audio = getGlobalStoryAudio();
    audioRef.current = audio;

    // Si une autre histoire jouait dans le singleton, on l'arrête
    if (audio && globalPlayingStoryId && globalPlayingStoryId !== storyId) {
      audio.pause();
      audio.src = '';
      globalPlayingStoryId = null;
      globalPlayingUrl = null;
      setIsPlaying(false);
    } else if (audio && globalPlayingStoryId === storyId && !audio.paused && !audio.ended) {
      // Si la même histoire est déjà en lecture (ex: re-mount du composant), synchroniser l'icône Pause
      currentPlayingUrlRef.current = globalPlayingUrl;
      setIsPlaying(true);
      if (audio.duration) {
        setDuration(audio.duration);
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        // Chargement parallèle immédiat des fichiers audio et des voix utilisateur (évite la latence initiale)
        const [fetchedFiles, voicesRes] = await Promise.all([
          fetchAudioFiles(storyId),
          supabase
            .from('user_voices')
            .select('id, name, relation, category, category_name, voice_ref_path, transcript')
        ]);

        // Nettoyage en tâche de fond sans bloquer l'affichage
        cleanupStuckFiles(storyId).catch(() => {});
        recoverErrorFiles(storyId).catch(() => {});

        if (!isMounted) return;

        if (!voicesRes.error && voicesRes.data) {
          const allVoices = voicesRes.data as CustomVoice[];
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
        console.error('Error initializing audio deck:', err);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      playbackSessionIdRef.current += 1;
      isStartingPlaybackRef.current = false;
      browserSpeechCancelledRef.current = true;
      if (utteranceRef.current) {
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
        utteranceRef.current = null;
      }
      if (synthRef.current) {
        try {
          synthRef.current.cancel();
        } catch {}
      }
      if (globalStoryAudio) {
        try {
          globalStoryAudio.pause();
        } catch {}
      }
    };
  }, [storyId]);

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

  // Fast-Play Auto-Play : démarre l'écoute dès que le premier bloc (Fast-Play) arrive (< 4s)
  useEffect(() => {
    if (autoPlayRequested && readyStoryAudioFile?.audio_url && !isPlaying) {
      console.log("⚡ [FastPlay] Déclenchement automatique de la lecture dès réception du premier chunk !");
      setAutoPlayRequested(false);
      handlePlayPause();
    }
  }, [readyStoryAudioFile?.audio_url, autoPlayRequested, isPlaying]);

  // Fast-Play Transition Fluide : bascule transparente sur l'audio complet quand il est assemblé
  useEffect(() => {
    if (isPlaying && audioRef.current && readyStoryAudioFile?.audio_url) {
      if (currentPlayingUrlRef.current && currentPlayingUrlRef.current !== readyStoryAudioFile.audio_url) {
        getSignedAudioUrl(readyStoryAudioFile.audio_url).then((newSignedUrl) => {
          if (newSignedUrl && audioRef.current && audioRef.current.src !== newSignedUrl) {
            const preservedTime = audioRef.current.currentTime;
            audioRef.current.src = newSignedUrl;
            audioRef.current.currentTime = preservedTime;
            audioRef.current.play().catch(() => {});
            currentPlayingUrlRef.current = readyStoryAudioFile.audio_url;
            globalPlayingUrl = readyStoryAudioFile.audio_url;
            console.log("🔄 [FastPlay] Transition fluide vers l'audio complet finalisée !");
          }
        });
      }
    }
  }, [readyStoryAudioFile?.audio_url, isPlaying]);

  // 🌙 Téléchargement Prédictif PWA / Routine : mise en cache locale transparente
  useEffect(() => {
    if (readyStoryAudioFile?.audio_url) {
      const cacheKey = getAudioCacheKey(storyId, readyStoryAudioFile.audio_url);
      audioCache.has(cacheKey, readyStoryAudioFile.file_size).then(async (exists) => {
        if (exists) {
          setIsOfflineReady(true);
        } else {
          try {
            const signedUrl = await getSignedAudioUrl(readyStoryAudioFile.audio_url);
            if (signedUrl) {
              await audioCache.prefetchAndCache(cacheKey, signedUrl, readyStoryAudioFile.file_size);
              setIsOfflineReady(true);
              console.log(`🌙 [AudioCache] Histoire ${storyId} pré-téléchargée pour la routine du coucher.`);
            }
          } catch (e) {
            // Silencieux
          }
        }
      });
    }
  }, [readyStoryAudioFile?.audio_url, readyStoryAudioFile?.file_size, storyId]);

  // Synthèse vocale du navigateur (Mode Gratuit)
  const playBrowserParagraph = (index: number) => {
    if (!synthRef.current) return;

    // Détacher les callbacks de l'utterance précédente avant cancel() pour éviter que onend ne relance la lecture sur Android
    if (utteranceRef.current) {
      utteranceRef.current.onstart = null;
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
      utteranceRef.current = null;
    }
    synthRef.current.cancel();

    const pText = paragraphs[index];
    if (!pText) {
      setIsPlaying(false);
      setIsBrowserSpeaking(false);
      setCurrentParagraphIndex(0);
      setProgress(0);
      return;
    }

    browserSpeechCancelledRef.current = false;

    // ✨ Déclenchement feutré du bruitage contextuel s'il est présent
    if (isSfxEnabled && pText) {
      const effect = detectContextualSoundEffect(pText);
      if (effect) {
        soundEffectsEngine.play(effect);
      }
    }

    const utterance = new SpeechSynthesisUtterance(pText);
    utterance.lang = 'fr-FR';

    const voices = synthRef.current.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith('fr'));
    if (frVoice) utterance.voice = frVoice;
    utterance.rate = 1.0;

    utterance.onstart = () => {
      if (browserSpeechCancelledRef.current) return;
      setIsPlaying(true);
      setIsBrowserSpeaking(true);
      const pct = (index / (paragraphs.length - 1 || 1)) * 100;
      setProgress(pct);
    };

    utterance.onend = () => {
      // Sur Android Chrome/WebView, speechSynthesis.cancel() déclenche onend : ne jamais passer au paragraphe suivant si annulé !
      if (browserSpeechCancelledRef.current) {
        return;
      }
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

    stopAllPlayback();

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
    if (isProlonging) {
      stopProlongation();
    }

    // 1. VÉRIFICATION UNIVERSELLE D'ARRÊT :
    // Si l'état React indique une lecture, OU si le singleton HTMLAudioElement joue, OU si SpeechSynthesis parle, OU si un chargement est en vol -> COUPE-CIRCUIT TOTAL !
    const audio = getGlobalStoryAudio();
    audioRef.current = audio;
    const isNativeAudioPlaying = Boolean(audio && !audio.paused && !audio.ended);
    const isSpeechSynthActive = isBrowserSpeaking || Boolean(
      typeof window !== 'undefined' && (window.speechSynthesis?.speaking || window.speechSynthesis?.pending)
    );

    if (isPlaying || isNativeAudioPlaying || isSpeechSynthActive || isStartingPlaybackRef.current) {
      stopAllPlayback();
      return;
    }

    // 2. Si un fichier audio prêt existe, on le lance directement
    if (readyStoryAudioFile?.audio_url && audio) {
      const sessionId = ++playbackSessionIdRef.current;
      isStartingPlaybackRef.current = true;
      // Basculer immédiatement le bouton sur Pause (⏸) pour permettre à l'utilisateur d'annuler même pendant le téléchargement
      setIsPlaying(true);

      try {
        let audioUrl = "";
        const cacheKey = getAudioCacheKey(storyId, readyStoryAudioFile.audio_url);
        const cachedBlob = await audioCache.get(cacheKey, readyStoryAudioFile.file_size);

        // Si l'utilisateur a appuyé sur Pause pendant la lecture du cache IndexedDB, on abandonne immédiatement
        if (sessionId !== playbackSessionIdRef.current) {
          return;
        }

        if (cachedBlob) {
          audioUrl = URL.createObjectURL(cachedBlob);
        } else {
          const signedUrl = await getSignedAudioUrl(readyStoryAudioFile.audio_url);
          if (sessionId !== playbackSessionIdRef.current) {
            return;
          }
          if (!signedUrl) throw new Error("Impossible d'accéder au fichier audio");
          audioUrl = signedUrl;
          audioCache.prefetchAndCache(cacheKey, signedUrl, readyStoryAudioFile.file_size).then(() => {
            setIsOfflineReady(true);
          }).catch(() => {});
        }

        // Ne remplacer audio.src que si le fichier sous-jacent a changé
        if (currentPlayingUrlRef.current !== readyStoryAudioFile.audio_url || !audio.src) {
          audio.src = audioUrl;
          currentPlayingUrlRef.current = readyStoryAudioFile.audio_url;
          globalPlayingUrl = readyStoryAudioFile.audio_url;
          globalPlayingStoryId = storyId;
        }
        audio.playbackRate = 1.0;

        // Synchronisation bidirectionnelle avec le lecteur natif OS / Android MediaSession
        audio.onplay = () => {
          setIsPlaying(true);
          if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
            try {
              navigator.mediaSession.playbackState = 'playing';
              navigator.mediaSession.setActionHandler('pause', () => stopAllPlaybackRef.current());
              navigator.mediaSession.setActionHandler('stop', () => stopAllPlaybackRef.current());
              navigator.mediaSession.setActionHandler('play', () => {
                audio.play().catch(() => {});
              });
            } catch {}
          }
        };
        audio.onpause = () => {
          if (!audio.ended) {
            // Si la pause est déclenchée depuis le volet de notifications Android, l'écran verrouillé ou un casque Bluetooth,
            // exécuter systématiquement le coupe-circuit complet (musique de fond + auto-scroll + UI)
            stopAllPlaybackRef.current();
          }
        };
        audio.onloadedmetadata = () => setDuration(audio.duration);
        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
          if (audio.duration) {
            setProgress((audio.currentTime / audio.duration) * 100);

            // ✨ Bruitages contextuels feutrés au fil de la lecture
            if (isSfxEnabled && paragraphs.length > 0) {
              const activeParaIdx = Math.min(
                paragraphs.length - 1,
                Math.floor((audio.currentTime / audio.duration) * paragraphs.length)
              );
              if (activeParaIdx !== lastSfxParaIndexRef.current) {
                lastSfxParaIndexRef.current = activeParaIdx;
                const pText = paragraphs[activeParaIdx];
                if (pText) {
                  const effect = detectContextualSoundEffect(pText);
                  if (effect) {
                    soundEffectsEngine.play(effect);
                  }
                }
              }
            }

            // 🌙 Soft Fade-out Sommeil : fondu progressif imperceptible sur les 30 dernières secondes
            const remaining = audio.duration - audio.currentTime;
            if (remaining > 0 && remaining <= 30) {
              const fadeRatio = Math.max(0, remaining / 30);
              audio.volume = fadeRatio;
              backgroundSound.setVolume(fadeRatio * 0.16);
            } else if (remaining > 30) {
              audio.volume = 1.0;
            }
          }
        };
        audio.onended = () => {
          setIsPlaying(false);
          setProgress(0);
          setCurrentTime(0);
          audio.volume = 1.0;
          lastSfxParaIndexRef.current = -1;

          // 🌙 Prolongation Dodo (15 min) : maintient la berceuse/ambiance pour endormir l'enfant
          if (isProlongationEnabled && (soundId || objective)) {
            setIsProlonging(true);
            setProlongationSecondsLeft(900); // 15 min
            backgroundSound.setVolume(0.18); // Volume feutré

            if (!backgroundSound.isPlaying) {
              backgroundSound.togglePlay();
            }

            if (prolongationTimerRef.current) clearInterval(prolongationTimerRef.current);
            let seconds = 900;
            prolongationTimerRef.current = setInterval(() => {
              seconds -= 1;
              setProlongationSecondsLeft(seconds);

              // Fondu de sortie imperceptible sur la dernière minute (60s)
              if (seconds <= 60 && seconds > 0) {
                const fade = Math.max(0, (seconds / 60) * 0.18);
                backgroundSound.setVolume(fade);
              }

              if (seconds <= 0) {
                if (prolongationTimerRef.current) clearInterval(prolongationTimerRef.current);
                prolongationTimerRef.current = null;
                setIsProlonging(false);
                if (backgroundSound.isPlaying) {
                  backgroundSound.togglePlay();
                }
                backgroundSound.setVolume(0.40);
              }
            }, 1000);
          } else {
            if (backgroundSound.isPlaying && wasBgAutoStartedRef.current) {
              wasBgAutoStartedRef.current = false;
              backgroundSound.togglePlay();
            }
            backgroundSound.setVolume(0.40);
          }
        };
        audio.onerror = () => {
          toast({
            title: "Erreur audio",
            description: "Impossible de lire le fichier.",
            variant: "destructive"
          });
          setIsPlaying(false);
          isStartingPlaybackRef.current = false;
        };

        if (currentTime > 0 && duration > 0 && currentTime < duration && Math.abs(audio.currentTime - currentTime) > 1) {
          audio.currentTime = currentTime;
        }

        if (sessionId !== playbackSessionIdRef.current) {
          audio.pause();
          return;
        }

        await audio.play();
        if (sessionId !== playbackSessionIdRef.current) {
          audio.pause();
          return;
        }
        setIsPlaying(true);
      } catch (err: any) {
        if (sessionId === playbackSessionIdRef.current) {
          toast({
            title: "Erreur de lecture",
            description: err?.message || "Erreur de lecture audio",
            variant: "destructive"
          });
          setIsPlaying(false);
        }
      } finally {
        if (sessionId === playbackSessionIdRef.current) {
          isStartingPlaybackRef.current = false;
        }
      }
      return;
    }

    // 3. Si l'audio est déjà en cours de génération
    if (currentPendingAudioFile || isGenerating) {
      return;
    }

    // 4. Si c'est une voix locale gratuite
    if (selectedVoiceId === 'local') {
      playBrowserParagraph(currentParagraphIndex);
      return;
    }

    // 5. Lancement de la génération avec Fast-Play auto-play dès que le premier bloc est prêt
    setAutoPlayRequested(true);
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

        {/* 🌙 BANNIÈRE PROLONGATION SOMMEIL (15 min) */}
        {isProlonging && (
          <div className="px-3 py-1 bg-primary/10 border-b border-primary/20 flex items-center justify-between text-[11px] text-primary">
            <span className="flex items-center gap-1.5 font-medium animate-pulse">
              <span>🌙</span> Prolongation dodo active ({formatTime(prolongationSecondsLeft)})
            </span>
            <button 
              onClick={stopProlongation}
              className="text-[10px] underline hover:opacity-80 ml-2 font-medium"
            >
              Arrêter
            </button>
          </div>
        )}

        {/* 🌟 2. CONTENUS DE LA CAPSULE ZEN (Hauteur compacte ~52 px) */}
        <div className="h-[52px] px-2.5 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2 pt-1">
          
          {/* GAUCHE : SÉLECTEUR DE NARRATEUR DISCRET */}
          <Popover open={isVoicePopoverOpen} onOpenChange={setIsVoicePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 sm:h-9 px-2 sm:px-2.5 rounded-full text-xs font-medium flex items-center gap-1 sm:gap-1.5 min-w-0 flex-shrink transition-all",
                  isDarkMode 
                    ? "bg-white/5 hover:bg-white/10 text-white border border-white/10" 
                    : "bg-primary-soft/20 hover:bg-primary-soft/40 text-gray-900 border border-primary-soft/30"
                )}
              >
                <span className="text-xs sm:text-sm shrink-0">
                  {selectedVoiceId === 'local' ? "🔊" : "🎙️"}
                </span>
                <span className="max-w-[68px] xs:max-w-[85px] sm:max-w-[130px] truncate font-sans">
                  {voiceDisplayName}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
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
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Recul 10s */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSeekRelative(-10)}
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
              title="Reculer de 10 secondes"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* Bouton Action Principal */}
            {isAudioProcessing ? (
              // En cours de génération : respiration lumineuse
              <div className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center gap-1.5 sm:gap-2 animate-pulse text-xs font-medium shrink-0">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden xs:inline">Création…</span>
              </div>
            ) : !isAudioReady && selectedVoiceId !== 'local' ? (
              // Pas encore généré : Bouton Magique "Créer l'audio"
              <Button
                onClick={handlePlayPause}
                className="h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-md hover:scale-105 transition-all shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Créer l'audio</span>
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
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
              title="Avancer de 10 secondes"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>

          {/* DROITE : HORS-LIGNE + AMBIANCE SONORE (🌙) ÉPURÉE */}
          <div className="flex items-center gap-1 shrink-0">
            {readyStoryAudioFile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  if (readyStoryAudioFile.audio_url) {
                    try {
                      const cacheKey = getAudioCacheKey(storyId, readyStoryAudioFile.audio_url);
                      const signedUrl = await getSignedAudioUrl(readyStoryAudioFile.audio_url);
                      if (signedUrl) {
                        await audioCache.prefetchAndCache(cacheKey, signedUrl, readyStoryAudioFile.file_size);
                        setIsOfflineReady(true);
                        toast({
                          title: "Histoire enregistrée hors-ligne",
                          description: "Prête pour écouter ce soir sans Wi-Fi ni réseau 🌙",
                        });
                      }
                    } catch {
                      toast({
                        title: "Erreur sauvegarde",
                        description: "Impossible d'enregistrer l'histoire hors-ligne",
                        variant: "destructive"
                      });
                    }
                  }
                }}
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all shrink-0",
                  isOfflineReady 
                    ? "text-emerald-500 hover:text-emerald-600 bg-emerald-500/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                title={isOfflineReady ? "Histoire disponible hors-ligne" : "Sauvegarder pour le coucher sans Wi-Fi"}
              >
                {isOfflineReady ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              </Button>
            )}

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
                    "h-8 w-8 sm:h-9 sm:w-9 rounded-full transition-all shrink-0",
                    backgroundSound.isPlaying 
                      ? "bg-primary/20 text-primary border border-primary/30 shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  title={backgroundSound.isPlaying ? "Ambiance sonore active (clic pour couper, réglages au clic droit)" : "Ambiance & Bruitages doux"}
                >
                  <Moon className={cn("w-4 h-4", backgroundSound.isPlaying && "animate-pulse")} />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                side="top" 
                align="end" 
                className="w-56 p-3 rounded-2xl backdrop-blur-2xl shadow-2xl border bg-background/95 z-[100] space-y-3"
              >
                {/* Volume de l'ambiance */}
                <div className="space-y-1.5">
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

                {/* Bruitages féeriques contextuels ✨ */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-medium text-foreground">Bruitages féeriques</span>
                  </div>
                  <Switch 
                    checked={isSfxEnabled} 
                    onCheckedChange={(checked) => {
                      setIsSfxEnabled(checked);
                      soundEffectsEngine.setEnabled(checked);
                    }}
                    className="scale-75"
                  />
                </div>

                {/* Prolongation Dodo (15 min) 🌙 */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium text-foreground">Prolongation (15 min)</span>
                  </div>
                  <Switch 
                    checked={isProlongationEnabled} 
                    onCheckedChange={setIsProlongationEnabled}
                    className="scale-75"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

        </div>
      </div>
    </div>
  );
};

export default IntegratedAudioDeck;

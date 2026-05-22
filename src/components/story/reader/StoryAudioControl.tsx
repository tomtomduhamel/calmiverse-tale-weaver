import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';
import { N8nAudioPlayer } from './N8nAudioPlayer';
import { useUserSettings } from '@/hooks/settings/useUserSettings';
import { useFeatureAccess } from '@/hooks/subscription/useFeatureAccess';
import { useToast } from '@/hooks/use-toast';

interface StoryAudioControlProps {
  storyId: string;
  text: string;
  isDarkMode?: boolean;
  compact?: boolean;
}

const MOBILE_HINT_SESSION_KEY = 'calmi_browser_tts_mobile_hint_shown';

/**
 * Lecture audio gratuite via le Web Speech API (voix du navigateur).
 * Contourne le bug Chrome qui coupe la synthèse après ~15s en relançant
 * périodiquement pause()/resume() tant que la lecture est active.
 */
const BrowserTTSPlayer: React.FC<StoryAudioControlProps> = ({ text, isDarkMode = false, compact = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const clearKeepAlive = () => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  };

  const stop = () => {
    clearKeepAlive();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  // Nettoyage au démontage
  useEffect(() => stop, []);

  const play = () => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      toast({
        title: 'Lecture indisponible',
        description: "La voix du navigateur n'est pas supportée sur cet appareil.",
        variant: 'destructive',
      });
      return;
    }

    if (!text || text.trim().length === 0) {
      toast({ title: 'Erreur', description: 'Aucun texte à lire', variant: 'destructive' });
      return;
    }

    // Toujours repartir d'un état propre
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    const frVoice = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('fr'));
    if (frVoice) utterance.voice = frVoice;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      clearKeepAlive();
      setIsPlaying(false);
    };
    utterance.onerror = () => {
      clearKeepAlive();
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);

    // Contournement du bug Chrome (coupure ~15s)
    clearKeepAlive();
    keepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);

    // Avertissement mobile (une seule fois par session)
    if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(MOBILE_HINT_SESSION_KEY)) {
      sessionStorage.setItem(MOBILE_HINT_SESSION_KEY, '1');
      toast({
        title: 'Lecture démarrée',
        description: "Sur mobile, gardez l'écran allumé : la lecture s'arrête si l'écran se verrouille.",
      });
    }
  };

  const handleClick = () => (isPlaying ? stop() : play());

  if (compact) {
    return (
      <Button onClick={handleClick} variant="outline" size="icon" className="h-8 w-8" title="Lire l'histoire">
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      className={isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}
    >
      {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
      {isPlaying ? 'Pause' : "Lire l'histoire"}
    </Button>
  );
};

/**
 * Bouton de lecture audio unique.
 * Choisit le moteur selon la préférence utilisateur `audioMode` :
 * - 'premium' (et accès actif) -> voix Speechify via N8nAudioPlayer
 * - sinon -> voix du navigateur (gratuit, Web Speech API)
 */
export const StoryAudioControl: React.FC<StoryAudioControlProps> = (props) => {
  const { userSettings } = useUserSettings();
  const { hasAccess } = useFeatureAccess();

  const audioMode = userSettings.readingPreferences?.audioMode ?? 'browser';
  const usePremium = audioMode === 'premium' && hasAccess('audio_generation');

  if (usePremium) {
    return <N8nAudioPlayer {...props} />;
  }

  return <BrowserTTSPlayer {...props} />;
};

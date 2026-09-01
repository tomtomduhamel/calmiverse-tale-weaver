import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface StoryVideoIntroProps {
    videoUrl: string;
    onComplete: () => void;
}

export const StoryVideoIntro: React.FC<StoryVideoIntroProps> = ({ videoUrl, onComplete }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const ambientRef = useRef<HTMLVideoElement>(null);
    
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [showPlayStateFeedback, setShowPlayStateFeedback] = useState(false);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [isVideoPortrait, setIsVideoPortrait] = useState<boolean | null>(null);
    
    const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);
    const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
    const controlsHideTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-masquage des contrôles après 2.5s d'inactivité
    const resetControlsTimer = useCallback(() => {
        setControlsVisible(true);
        if (controlsHideTimerRef.current) clearTimeout(controlsHideTimerRef.current);
        controlsHideTimerRef.current = setTimeout(() => {
            setControlsVisible(false);
        }, 2500);
    }, []);

    // Détection automatique des dimensions de la vidéo pour adapter l'affichage sans crop
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const { videoWidth, videoHeight } = videoRef.current;
            if (videoWidth && videoHeight) {
                const isPortrait = videoHeight >= videoWidth;
                setIsVideoPortrait(isPortrait);
            }
        }
    };

    // Fonction de sortie fluide avec maintien sur la dernière frame puis fondu
    const triggerComplete = useCallback(() => {
        if (isFadingOut) return;
        setIsFadingOut(true);

        // Transition douce de 1000ms vers le texte du livre
        fadeOutTimerRef.current = setTimeout(() => {
            onComplete();
        }, 1000);
    }, [isFadingOut, onComplete]);

    // Auto-play the video when the component mounts
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().then(() => {
                setIsPlaying(true);
                if (ambientRef.current) {
                    ambientRef.current.play().catch(() => {});
                }
            }).catch(error => {
                console.warn("Autoplay was prevented:", error);
                setIsPlaying(false);
            });
        }

        resetControlsTimer();

        return () => {
            if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
            if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
            if (controlsHideTimerRef.current) clearTimeout(controlsHideTimerRef.current);
        };
    }, [resetControlsTimer]);

    const handleSkip = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.pause();
        }
        triggerComplete();
    };

    const togglePlay = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!videoRef.current) return;

        resetControlsTimer();

        if (isPlaying) {
            videoRef.current.pause();
            if (ambientRef.current) ambientRef.current.pause();
            setIsPlaying(false);
            setControlsVisible(true);
            if (controlsHideTimerRef.current) clearTimeout(controlsHideTimerRef.current);
        } else {
            videoRef.current.play();
            if (ambientRef.current) ambientRef.current.play().catch(() => {});
            setIsPlaying(true);
        }

        // Afficher brièvement l'icône de feedback au centre
        setShowPlayStateFeedback(true);
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => {
            setShowPlayStateFeedback(false);
        }, 600);
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        resetControlsTimer();
        if (videoRef.current) {
            const nextMuted = !isMuted;
            videoRef.current.muted = nextMuted;
            setIsMuted(nextMuted);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const duration = videoRef.current.duration;
            if (duration > 0) {
                setProgress(Math.min(100, (current / duration) * 100));
            }
        }
    };

    const handleVideoEnd = () => {
        // En fin de vidéo : figer la dernière image pendant 1.2s de contemplation avant d'initier le fondu
        setProgress(100);
        if (videoRef.current) {
            videoRef.current.pause();
        }
        if (ambientRef.current) {
            ambientRef.current.pause();
        }
        setTimeout(() => {
            triggerComplete();
        }, 1200);
    };

    return (
        <div 
            onClick={togglePlay}
            onMouseMove={resetControlsTimer}
            onTouchStart={resetControlsTimer}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden touch-none w-full h-[100dvh] cursor-pointer transition-opacity duration-1000 ease-in-out select-none ${
                isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
            {/* 1. Ambient Backdrop - Fond immersif flouté pour habiller les zones libres sans recadrer */}
            <video
                ref={ambientRef}
                src={videoUrl}
                muted
                playsInline
                loop
                aria-hidden="true"
                onError={() => {
                    console.warn("[StoryVideoIntro] Erreur de fond ambiant vidéo");
                }}
                className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-40 brightness-50 pointer-events-none select-none"
            />

            {/* 2. Main Video - Rendu intelligent zéro-crop adapté à l'orientation réelle de la vidéo */}
            <video
                ref={videoRef}
                src={videoUrl}
                className={`relative z-10 max-w-full max-h-full object-contain pointer-events-none select-none ${
                    isVideoPortrait === false
                        ? 'w-full aspect-video shadow-2xl'
                        : 'w-full h-full'
                }`}
                playsInline
                muted={isMuted}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnd}
                onError={() => {
                    console.warn("[StoryVideoIntro] Erreur de lecture vidéo principale, passage au lecteur d'histoire");
                    triggerComplete();
                }}
            />

            {/* 3. Voile dégradé très doux en haut pour la lisibilité des contrôles */}
            <div 
                className={`absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none z-20 transition-opacity duration-500 ${
                    controlsVisible ? 'opacity-100' : 'opacity-0'
                }`} 
            />

            {/* 4. Barre de progression ultra-fine tout en haut */}
            <div className="absolute top-0 left-0 right-0 z-30 pt-[max(env(safe-area-inset-top),10px)] px-3 pointer-events-none">
                <div className="w-full h-[2.5px] bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div 
                        className="h-full bg-white/85 rounded-full transition-all duration-100 ease-linear shadow-[0_0_6px_rgba(255,255,255,0.7)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* 5. Contrôles discrets et élégants ancrés en haut */}
            <div 
                className={`absolute top-0 left-0 right-0 z-30 pt-[max(calc(env(safe-area-inset-top)+14px),22px)] px-3.5 flex items-center justify-between pointer-events-none transition-opacity duration-400 ease-out ${
                    controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            >
                {/* Bouton Muet discret */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-7 w-7 rounded-full bg-black/30 hover:bg-black/50 text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all shadow-sm pointer-events-auto p-0 flex items-center justify-center"
                    aria-label={isMuted ? "Activer le son" : "Couper le son"}
                >
                    {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </Button>

                {/* Bouton Passer compact et élégant */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="h-7 px-3 rounded-full bg-black/30 hover:bg-black/50 text-white/80 hover:text-white border border-white/10 backdrop-blur-md text-[11px] font-medium transition-all shadow-sm pointer-events-auto"
                >
                    Passer
                </Button>
            </div>

            {/* 6. Indicateur Feedback Play/Pause éphémère au centre lors du tap */}
            {showPlayStateFeedback && (
                <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in fade-in zoom-in-90 duration-150">
                    <div className="p-3.5 rounded-full bg-black/40 backdrop-blur-md text-white/90 border border-white/10 shadow-xl">
                        {isPlaying ? <Play className="h-6 w-6 fill-white/80" /> : <Pause className="h-6 w-6 fill-white/80" />}
                    </div>
                </div>
            )}
        </div>
    );
};

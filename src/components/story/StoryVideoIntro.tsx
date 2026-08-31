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
    
    const fadeOutTimerRef = useRef<NodeJS.Timeout | null>(null);
    const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Fonction de sortie fluide avec fondu
    const triggerComplete = useCallback(() => {
        if (isFadingOut) return;
        setIsFadingOut(true);

        // Laisser le temps à la transition CSS (600ms) de se jouer doucement
        fadeOutTimerRef.current = setTimeout(() => {
            onComplete();
        }, 650);
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

        return () => {
            if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
            if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        };
    }, []);

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

        if (isPlaying) {
            videoRef.current.pause();
            if (ambientRef.current) ambientRef.current.pause();
            setIsPlaying(false);
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
        }, 800);
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
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
        // En fin de vidéo, la dernière frame reste affichée pendant le fondu vers la lecture
        setProgress(100);
        triggerComplete();
    };

    return (
        <div 
            onClick={togglePlay}
            className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden touch-none w-full h-[100dvh] cursor-pointer transition-opacity duration-700 ease-in-out ${
                isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
        >
            {/* 1. Ambient Backdrop - Fond immersif flouté pour habiller les bandes latérales sans recadrer */}
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
                className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-35 brightness-50 pointer-events-none select-none"
            />

            {/* 2. Main Video - En 'object-contain' pour préserver 100% du champ de vision sans zoom artificiel */}
            <video
                ref={videoRef}
                src={videoUrl}
                className="relative z-10 w-full h-full max-w-full max-h-full object-contain pointer-events-none select-none"
                playsInline
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoEnd}
                onError={() => {
                    console.warn("[StoryVideoIntro] Erreur de lecture vidéo principale, passage au lecteur d'histoire");
                    triggerComplete();
                }}
            />

            {/* Top Gradient for UI readability */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 via-black/30 to-transparent pointer-events-none z-20" />

            {/* Barre de progression style Story en haut */}
            <div className="absolute top-safe left-4 right-4 z-30 pt-3 pointer-events-none">
                <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden backdrop-blur-sm shadow-sm">
                    <div 
                        className="h-full bg-white/90 rounded-full transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Top Bar Controls : Bouton Mute & Bouton Passer */}
            <div className="absolute top-safe left-4 right-4 z-30 pt-7 flex items-center justify-between pointer-events-none">
                {/* Mute/Unmute */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white/90 border border-white/10 backdrop-blur-md transition-all shadow-md pointer-events-auto"
                    aria-label={isMuted ? "Activer le son" : "Couper le son"}
                >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>

                {/* Passer */}
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSkip}
                    className="bg-black/40 hover:bg-black/60 text-white/90 border border-white/15 backdrop-blur-md rounded-full px-3.5 h-8 text-xs font-medium transition-all shadow-md pointer-events-auto"
                >
                    Passer
                </Button>
            </div>

            {/* Indicateur Feedback Play/Pause au centre au clic */}
            {showPlayStateFeedback && (
                <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in fade-in zoom-in-75 duration-200">
                    <div className="p-4 rounded-full bg-black/60 backdrop-blur-md text-white/90 border border-white/15 shadow-2xl">
                        {isPlaying ? <Play className="h-8 w-8 fill-white/80" /> : <Pause className="h-8 w-8 fill-white/80" />}
                    </div>
                </div>
            )}

            {/* Bottom Play/Pause Helper Discreet */}
            <div className="absolute bottom-safe left-0 right-0 p-6 flex justify-center pb-8 z-20 pointer-events-none">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlay}
                    className="h-10 w-10 rounded-full bg-black/30 hover:bg-black/50 text-white/80 hover:text-white border border-white/10 backdrop-blur-sm pointer-events-auto transition-opacity duration-300 shadow-md"
                    aria-label={isPlaying ? "Mettre en pause" : "Lire la vidéo"}
                >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    );
};

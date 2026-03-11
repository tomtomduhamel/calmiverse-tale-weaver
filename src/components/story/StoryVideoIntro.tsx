import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

interface StoryVideoIntroProps {
    videoUrl: string;
    onComplete: () => void;
}

export const StoryVideoIntro: React.FC<StoryVideoIntroProps> = ({ videoUrl, onComplete }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(true);

    // Auto-play the video when the component mounts
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.warn("Autoplay was prevented:", error);
                setIsPlaying(false);
            });
        }
    }, []);

    const handleSkip = () => {
        if (videoRef.current) {
            videoRef.current.pause();
        }
        onComplete();
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black overflow-hidden touch-none w-full h-[100dvh]">
            {/* Video element - optimized for portrait mobile screens */}
            <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-cover"
                playsInline
                onEnded={onComplete}
            // Interaction user acquise lors du clic sur l'histoire donc le son devrait marcher
            />

            {/* Top Gradient for readability of the skip button */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

            {/* Skip Button - Discreet & elegant in top right corner */}
            <div className="absolute top-safe right-4 z-10 pt-4">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSkip}
                    className="bg-black/30 hover:bg-black/50 text-white border-white/20 backdrop-blur-md rounded-full px-4 text-xs font-medium transition-all"
                >
                    Passer
                </Button>
            </div>

            {/* Bottom controls (Optional, but good for accessibility if they want to pause) */}
            <div className="absolute bottom-safe left-0 right-0 p-6 flex justify-center pb-8 z-10 pointer-events-none">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlay}
                    className="text-white/70 hover:text-white pointer-events-auto transition-opacity duration-300"
                >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
            </div>
        </div>
    );
};

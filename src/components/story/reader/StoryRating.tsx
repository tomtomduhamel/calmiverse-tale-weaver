import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useStoryRating } from '@/hooks/stories/useStoryRating';

interface StoryRatingProps {
    storyId: string;
    initialRating?: number;
    initialComment?: string;
    onRatingSubmitted?: (rating: number) => void;
}

export const StoryRating: React.FC<StoryRatingProps> = ({
    storyId,
    initialRating,
    initialComment,
    onRatingSubmitted
}) => {
    const [rating, setRating] = useState<number>(initialRating || 0);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [comment, setComment] = useState<string>(initialComment || '');
    const [isSubmitted, setIsSubmitted] = useState<boolean>(!!initialRating);
    const { submitRating, isSubmitting } = useStoryRating();

    const handleRatingClick = (selectedRating: number) => {
        if (isSubmitted) return;
        setRating(selectedRating);
    };

    const handleMouseEnter = (index: number) => {
        if (isSubmitted) return;
        setHoveredRating(index);
    };

    const handleMouseLeave = () => {
        if (isSubmitted) return;
        setHoveredRating(0);
    };

    const handleSubmit = async () => {
        if (rating === 0) return;

        // Note : Le commentaire est maintenant optionnel, même pour 1 étoile,
        // mais toujours transmis s'il est présent.
        const success = await submitRating(storyId, rating, comment);

        if (success) {
            setIsSubmitted(true);
            if (onRatingSubmitted) {
                onRatingSubmitted(rating);
            }
        }
    };

    if (isSubmitted) {
        return (
            <div className="flex flex-col items-center justify-center p-6 bg-primary/5 rounded-lg border border-primary/10 animate-fade-in">
                <p className="text-lg font-medium text-primary mb-2">Merci pour votre avis !</p>
                <div className="flex gap-1">
                    {[1, 2, 3, 4].map((star) => (
                        <Star
                            key={star}
                            className={cn(
                                "w-6 h-6",
                                star <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"
                            )}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-card rounded-xl border shadow-sm space-y-4">
            <div className="text-center">
                <h3 className="text-lg font-semibold mb-1">Avez-vous aimé cette histoire ?</h3>
                <p className="text-sm text-muted-foreground">Notez-la pour nous aider à nous améliorer</p>
            </div>

            {/* Étoiles */}
            <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4].map((star) => (
                    <button
                        key={star}
                        onClick={() => handleRatingClick(star)}
                        onMouseEnter={() => handleMouseEnter(star)}
                        onMouseLeave={handleMouseLeave}
                        className="transition-transform hover:scale-110 focus:outline-none"
                        type="button"
                    >
                        <Star
                            className={cn(
                                "w-10 h-10 transition-colors duration-200",
                                star <= (hoveredRating || rating)
                                    ? "fill-yellow-400 text-yellow-400 drop-shadow-sm"
                                    : "text-muted-foreground/30 hover:text-yellow-400/50"
                            )}
                        />
                    </button>
                ))}
            </div>

            {/* Zone de commentaire (Conditionnelle ou toujours visible pour feedback ?) 
          Demande : "Si l'utilisateur met 1 étoile, d'ajouter un commentaire" -> Obligatoire pour 1, optionnel (ou caché) pour les autres ?
          Implémentation : Affiché si note > 0, obligatoire si note == 1.
          Si note sélectionnée == 1 : Afficher textarea avec label "Dites-nous ce qui n'a pas plu (Obligatoire)"
          Si note > 1 : Afficher textarea optionnelle "Un petit commentaire ? (Optionnel)"
      */}

            {rating > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Textarea
                        placeholder={rating === 1
                            ? "Pourriez-vous nous dire ce qui peut être amélioré ? (Cela nous aide beaucoup !)"
                            : "Qu'avez-vous le plus aimé ? (Optionnel)"}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="resize-none min-h-[80px]"
                    />
                    {rating === 1 && !comment.trim() && (
                        <p className="text-xs text-muted-foreground ml-1 italic">
                            Votre retour est précieux pour améliorer Calmiverse, mais pas obligatoire.
                        </p>
                    )}

                    <Button
                        onClick={handleSubmit}
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Envoi..." : "Envoyer mon avis"}
                    </Button>
                </div>
            )}
        </div>
    );
};

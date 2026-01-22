import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseStoryRatingReturn {
    submitRating: (storyId: string, rating: number, comment?: string) => Promise<boolean>;
    isSubmitting: boolean;
}

export const useStoryRating = (): UseStoryRatingReturn => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const submitRating = async (storyId: string, rating: number, comment?: string): Promise<boolean> => {
        setIsSubmitting(true);
        try {
            console.log(`[useStoryRating] Soumission de la note pour l'histoire ${storyId}: ${rating} étoiles`, comment ? `Commentaire: ${comment}` : 'Sans commentaire');

            // Préparation de l'objet de mise à jour
            // Note: On utilise 'any' temporairement pour éviter les erreurs de type strict si les colonnes ne sont pas encore regénérées dans les types Supabase
            const updates: any = {
                rating: rating,
                rating_comment: comment || null,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('stories')
                .update(updates)
                .eq('id', storyId);

            if (error) {
                console.error('[useStoryRating] Erreur Supabase:', error);
                throw error;
            }

            toast({
                title: "Merci pour votre avis !",
                description: "Votre note a été enregistrée avec succès.",
            });

            return true;
        } catch (error) {
            console.error('[useStoryRating] Erreur lors de la soumission de la note:', error);
            toast({
                title: "Erreur",
                description: "Impossible d'enregistrer votre note. Veuillez réessayer.",
                variant: "destructive"
            });
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        submitRating,
        isSubmitting
    };
};

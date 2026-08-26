import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { offlineStorageService } from '@/services/offline/offlineStorageService';

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

            // Si l'appareil est hors-ligne, enfiler la note directement
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                await offlineStorageService.queueOfflineRating(storyId, 'offline-user', rating, comment);
                toast({
                    title: "Avis enregistré hors-ligne",
                    description: "Votre note a été sauvegardée et sera synchronisée dès le retour de la connexion.",
                });
                return true;
            }

            const updates = {
                rating: rating,
                rating_comment: comment || null,
                updatedat: new Date().toISOString()
            };

            const { error } = await supabase
                .from('stories')
                .update(updates)
                .eq('id', storyId);

            if (error) {
                console.warn('[useStoryRating] Échec envoi direct, mise en file d\'attente locale:', error);
                await offlineStorageService.queueOfflineRating(storyId, 'offline-user', rating, comment);
                toast({
                    title: "Avis sauvegardé en local",
                    description: "Votre note sera synchronisée automatiquement sous peu.",
                });
                return true;
            }

            toast({
                title: "Merci pour votre avis !",
                description: "Votre note a été enregistrée avec succès.",
            });

            return true;
        } catch (error: any) {
            console.error('[useStoryRating] Erreur lors de la soumission de la note:', error);
            // Fallback en file d'attente
            try {
                await offlineStorageService.queueOfflineRating(storyId, 'offline-user', rating, comment);
                toast({
                    title: "Avis mis en attente",
                    description: "Votre note sera transmise dès que possible.",
                });
                return true;
            } catch {
                toast({
                    title: "Erreur",
                    description: `Impossible d'enregistrer votre note: ${error.message || "Erreur inconnue"}`,
                    variant: "destructive"
                });
                return false;
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        submitRating,
        isSubmitting
    };
};

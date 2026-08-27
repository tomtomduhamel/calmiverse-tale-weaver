import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import type { Story } from '@/types/story';

interface UseRealtimeSequelStatusProps {
  onStoryCompleted?: (story: Story) => void;
  enabled?: boolean;
}

/**
 * Hook de notification temps réel pour les suites d'histoires
 * Utilise Supabase Realtime pour détecter quand une suite est terminée
 * et afficher une notification toast instantanée
 */
export const useRealtimeSequelStatus = ({
  onStoryCompleted,
  enabled = true
}: UseRealtimeSequelStatusProps = {}) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled) return;

    console.log('[useRealtimeSequelStatus] Initialisation de l\'écoute temps réel');

    // S'abonner aux changements sur la table stories
    const channel = supabase
      .channel('stories-realtime-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories'
        },
        (payload) => {
          console.log('[useRealtimeSequelStatus] Changement détecté:', payload);
          
          const oldStory = payload.old as Partial<Story>;
          const newStory = payload.new as Partial<Story>;

          // Vérifier si le statut est passé de 'pending' à 'completed' ou 'ready'
          const wasGenerating = oldStory.status === 'pending';
          const isNowReady = newStory.status === 'completed' || newStory.status === 'ready';

          if (wasGenerating && isNowReady) {
            console.log('[useRealtimeSequelStatus] Suite terminée détectée:', newStory.title);
            
            // Afficher une notification toast avec bouton de lecture directe
            toast({
              title: "🎉 Suite prête !",
              description: (
                <div className="space-y-2">
                  <p className="font-medium">{newStory.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Votre nouvelle histoire est maintenant disponible
                  </p>
                </div>
              ),
              action: (
                <Button
                  size="sm"
                  onClick={() => {
                    console.log('[useRealtimeSequelStatus] Navigation vers l\'histoire:', newStory.id);
                    navigate(`/app/reader/${newStory.id}`);
                  }}
                >
                  Lire maintenant
                </Button>
              ),
              duration: 10000, // 10 secondes pour laisser le temps de cliquer
            });

            // Callback optionnel (ex: rafraîchissement cache)
            if (onStoryCompleted) {
              onStoryCompleted(newStory as Story);
            }
          }

          // Détecter les erreurs
          if (oldStory.status === 'pending' && newStory.status === 'error') {
            console.error('[useRealtimeSequelStatus] Erreur de génération détectée:', newStory.error);
            
            toast({
              title: "❌ Erreur de génération",
              description: (
                <div className="space-y-1">
                  <p className="font-medium">{newStory.title}</p>
                  <p className="text-sm text-destructive">
                    {newStory.error || 'Une erreur est survenue lors de la génération'}
                  </p>
                </div>
              ),
              variant: "destructive",
              duration: 8000,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeSequelStatus] Statut de la souscription:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[useRealtimeSequelStatus] ✅ Souscription active pour les notifications temps réel');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useRealtimeSequelStatus] ❌ Erreur de canal Realtime');
        } else if (status === 'TIMED_OUT') {
          console.error('[useRealtimeSequelStatus] ⏱️ Timeout de connexion Realtime');
        }
      });

    // Cleanup: se désabonner lors du démontage
    return () => {
      console.log('[useRealtimeSequelStatus] Nettoyage de la souscription Realtime');
      supabase.removeChannel(channel);
    };
  }, [enabled, toast, onStoryCompleted]);

  return {
    // Ce hook ne retourne rien car il gère automatiquement les notifications
    // Il pourrait retourner des informations de statut si nécessaire
  };
};

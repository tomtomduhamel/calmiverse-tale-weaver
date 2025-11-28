import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook pour finaliser l'inscription beta après confirmation email
 * Vérifie si un code beta est en attente dans localStorage et l'enregistre
 */
export const useBetaRegistrationComplete = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const completeBetaRegistration = async () => {
      // Ne traiter qu'une seule fois
      if (isProcessing || isCompleted) return;

      const pendingCode = localStorage.getItem('pending_beta_code');
      const pendingEmail = localStorage.getItem('pending_beta_email');

      // Si pas de code pending ou pas d'utilisateur connecté, ne rien faire
      if (!pendingCode || !pendingEmail || !user) {
        return;
      }

      console.log("[Beta] Completing beta registration for user:", user.id);
      setIsProcessing(true);

      try {
        // Récupérer la tentative d'inscription en cours
        const { data: attemptData } = await supabase
          .from('beta_registration_attempts')
          .select('id')
          .eq('email', pendingEmail)
          .eq('invitation_code', pendingCode)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data, error } = await supabase.rpc('register_beta_request', {
          p_user_id: user.id,
          p_email: pendingEmail,
          p_code: pendingCode
        });

        if (error) {
          console.error("[Beta] Error completing beta registration:", error);
          
          // Marquer la tentative comme échouée
          if (attemptData?.id) {
            await supabase
              .from('beta_registration_attempts')
              .update({ 
                status: 'failed', 
                error_message: error.message,
                updated_at: new Date().toISOString()
              })
              .eq('id', attemptData.id);
          }
          
          toast({
            title: "Erreur d'inscription beta",
            description: "Impossible d'enregistrer votre demande beta. Contactez le support.",
            variant: "destructive",
          });
        } else {
          console.log("[Beta] Beta registration completed:", data);
          
          // Marquer la tentative comme complétée
          if (attemptData?.id) {
            await supabase
              .from('beta_registration_attempts')
              .update({ 
                status: 'completed',
                user_id: user.id,
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('id', attemptData.id);
          }
          
          // Nettoyer localStorage
          localStorage.removeItem('pending_beta_code');
          localStorage.removeItem('pending_beta_email');
          
          toast({
            title: "Demande beta enregistrée",
            description: "Votre compte est en attente de validation par notre équipe.",
          });
          
          setIsCompleted(true);
        }
      } catch (err) {
        console.error("[Beta] Failed to complete beta registration:", err);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'enregistrement de votre demande beta.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    completeBetaRegistration();
  }, [user, toast, isProcessing, isCompleted]);

  return {
    isProcessing,
    isCompleted,
    hasPendingBetaCode: !!localStorage.getItem('pending_beta_code')
  };
};

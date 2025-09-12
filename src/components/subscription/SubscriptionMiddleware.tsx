import React, { useEffect } from 'react';
import { useQuotaChecker } from '@/hooks/subscription/useQuotaChecker';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionMiddlewareProps {
  children: React.ReactNode;
}

// Hook pour valider une action avant son exécution
export const useActionValidator = () => {
  const { validateAction, incrementUsage } = useQuotaChecker();
  const { toast } = useToast();

  const validateAndExecute = async (
    action: 'create_story' | 'generate_audio' | 'add_child',
    callback: () => Promise<void> | void,
    onBlock?: (reason: string) => void
  ) => {
    try {
      const validation = await validateAction(action);
      
      if (!validation.allowed && validation.reason) {
        toast({
          title: "Limite atteinte",
          description: validation.reason,
          variant: "destructive"
        });
        onBlock?.(validation.reason);
        return false;
      }

      // Exécuter l'action
      await callback();

      // Incrémenter l'usage après succès
      if (action === 'create_story') {
        await incrementUsage('story');
      } else if (action === 'generate_audio') {
        await incrementUsage('audio');
      }

      return true;
    } catch (error: any) {
      console.error('Error in action validation:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'exécution de l'action",
        variant: "destructive"
      });
      return false;
    }
  };

  return { validateAndExecute };
};

const SubscriptionMiddleware: React.FC<SubscriptionMiddlewareProps> = ({ children }) => {
  return <>{children}</>;
};

export default SubscriptionMiddleware;
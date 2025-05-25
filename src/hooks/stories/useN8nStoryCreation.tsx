
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import type { Child } from '@/types/child';

interface N8nStoryRequest {
  childrenIds: string[];
  objective: string;
  webhookUrl: string;
}

export const useN8nStoryCreation = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const createStoryWithN8n = useCallback(async (
    formData: N8nStoryRequest,
    children: Child[] = []
  ) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    if (!formData.webhookUrl) {
      throw new Error("URL de webhook n8n requise");
    }

    setIsGenerating(true);

    try {
      console.log('[N8nStoryCreation] Déclenchement webhook n8n:', formData);

      // Récupérer les noms des enfants
      const childrenNames = formData.childrenIds.map(id => {
        const child = children.find(c => c.id === id);
        return child?.name || `Enfant-${id.slice(0, 8)}`;
      });

      // Préparer les données pour n8n
      const n8nData = {
        userId: user.id,
        userEmail: user.email,
        objective: formData.objective,
        childrenNames,
        childrenIds: formData.childrenIds,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID().slice(0, 8)
      };

      console.log('[N8nStoryCreation] Envoi données à n8n:', n8nData);

      // Appeler le webhook n8n
      const response = await fetch(formData.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(n8nData)
      });

      if (!response.ok) {
        throw new Error(`Erreur webhook n8n: ${response.status}`);
      }

      const result = await response.json();
      console.log('[N8nStoryCreation] Réponse n8n:', result);

      toast({
        title: "Génération démarrée",
        description: "La génération via n8n a été déclenchée. L'histoire apparaîtra dans votre bibliothèque une fois créée.",
      });

      return result;

    } catch (error: any) {
      console.error('[N8nStoryCreation] Erreur:', error);
      
      toast({
        title: "Erreur n8n",
        description: error.message || "Impossible de déclencher la génération via n8n",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [user, toast]);

  return {
    createStoryWithN8n,
    isGenerating
  };
};

export default useN8nStoryCreation;

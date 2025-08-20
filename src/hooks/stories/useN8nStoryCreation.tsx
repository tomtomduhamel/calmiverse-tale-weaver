import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import type { Child } from '@/types/child';
import { generateAdvancedStoryPrompt } from '@/utils/storyPromptUtils';

interface N8nStoryRequest {
  childrenIds: string[];
  objective: string;
}

// Webhook n8n de production
const N8N_WEBHOOK = "https://n8n.srv856374.hstgr.cloud/webhook/4cd35a66-3113-40a9-9e89-8f79ce59b44f";

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

    setIsGenerating(true);

    try {
      console.log('[N8nStoryCreation] Déclenchement webhook n8n de production:', formData);

      // Récupérer les enfants sélectionnés avec leurs données complètes
      const selectedChildren = formData.childrenIds.map(id => {
        const child = children.find(c => c.id === id);
        if (!child) {
          throw new Error(`Enfant avec l'ID ${id} non trouvé`);
        }
        return child;
      });

      // Générer le prompt avancé avec analyse des personnages et adaptation d'âge
      const storyPrompt = generateAdvancedStoryPrompt(formData.objective, selectedChildren);
      
      // Extraire les noms et genres pour la compatibilité avec n8n
      const childrenNames = selectedChildren.map(child => child.name);
      const childrenGenders = selectedChildren.map(child => child.gender);

      // Préparer les données enrichies pour n8n
      const n8nData = {
        userId: user.id,
        userEmail: user.email,
        objective: formData.objective,
        childrenNames,
        childrenGenders,
        childrenIds: formData.childrenIds,
        childrenData: selectedChildren.map(child => ({
          id: child.id,
          name: child.name,
          gender: child.gender,
          birthDate: child.birthDate.toISOString(),
          age: Math.floor((Date.now() - child.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        })),
        storyPrompt, // Prompt avancé avec contexte multi-personnages
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID().slice(0, 8)
      };

      console.log('[N8nStoryCreation] Envoi données à n8n production:', {
        ...n8nData,
        storyPrompt: `${storyPrompt.substring(0, 100)}...` // Log tronqué pour la lisibilité
      });

      // Appeler le webhook n8n de production
      const response = await fetch(N8N_WEBHOOK, {
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
      console.log('[N8nStoryCreation] Réponse n8n production:', result);

      toast({
        title: "Génération d'histoire démarrée",
        description: "Votre histoire est en cours de création. Elle apparaîtra dans votre bibliothèque dès qu'elle sera prête.",
      });

      return result;

    } catch (error: any) {
      console.error('[N8nStoryCreation] Erreur:', error);
      
      toast({
        title: "Erreur de génération",
        description: error.message || "Impossible de créer l'histoire. Veuillez réessayer.",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [user, toast]);

  const cancelStoryCreation = useCallback(() => {
    console.log('[N8nStoryCreation] Annulation de la création d\'histoire');
    setIsGenerating(false);
    
    toast({
      title: "Création annulée",
      description: "La création de l'histoire a été annulée. Vous pouvez recommencer.",
    });
  }, [toast]);

  return {
    createStoryWithN8n,
    isGenerating,
    cancelStoryCreation
  };
};

export default useN8nStoryCreation;
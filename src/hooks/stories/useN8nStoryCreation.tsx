
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

// Fonction pour générer le prompt d'histoire complet
const generateStoryPrompt = (objective: string, childrenNames: string[]): string => {
  const childrenText = childrenNames.length === 1 
    ? childrenNames[0] 
    : `${childrenNames.slice(0, -1).join(', ')} et ${childrenNames[childrenNames.length - 1]}`;

  const objectivePrompts = {
    sleep: `Créez une histoire douce et apaisante pour aider ${childrenText} à s'endormir. L'histoire doit être calme, réconfortante et se terminer de manière paisible. Utilisez un langage simple et des images relaxantes.`,
    focus: `Créez une histoire engageante qui aide ${childrenText} à se concentrer. L'histoire doit captiver l'attention tout en étant éducative et stimulante intellectuellement.`,
    relax: `Créez une histoire relaxante pour aider ${childrenText} à se détendre. L'histoire doit être apaisante, avec un rythme lent et des éléments qui favorisent la relaxation.`,
    fun: `Créez une histoire amusante et divertissante pour ${childrenText}. L'histoire doit être joyeuse, pleine d'aventures et de moments ludiques qui feront sourire.`
  };

  const basePrompt = objectivePrompts[objective as keyof typeof objectivePrompts] || 
    `Créez une histoire personnalisée pour ${childrenText} avec pour objectif: ${objective}.`;

  return `${basePrompt}

Instructions pour la génération :
- Personnalisez l'histoire avec le(s) prénom(s) : ${childrenText}
- Adaptez le vocabulaire et la complexité à l'âge des enfants
- Créez une histoire d'environ 800-1200 mots
- Structurez avec un début, un développement et une fin satisfaisante
- Incluez des éléments magiques ou imaginaires adaptés à l'enfance
- Assurez-vous que l'histoire respecte l'objectif : ${objective}
- Utilisez un ton bienveillant et positif
- Évitez tout contenu effrayant ou inapproprié

Générez maintenant l'histoire complète en français.`;
};

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

      // Générer le prompt complet pour l'histoire
      const storyPrompt = generateStoryPrompt(formData.objective, childrenNames);

      // Préparer les données enrichies pour n8n
      const n8nData = {
        userId: user.id,
        userEmail: user.email,
        objective: formData.objective,
        childrenNames,
        childrenIds: formData.childrenIds,
        storyPrompt, // Ajout du prompt complet
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID().slice(0, 8),
        // Données supplémentaires pour n8n
        callbackUrl: `${window.location.origin}/supabase/functions/n8n-story-webhook`,
        expectedResponse: {
          title: "string - Titre de l'histoire",
          content: "string - Contenu complet de l'histoire",
          summary: "string - Résumé de l'histoire",
          preview: "string - Aperçu court de l'histoire",
          objective: formData.objective,
          childrenNames: childrenNames,
          userId: user.id,
          childrenIds: formData.childrenIds,
          status: "completed"
        }
      };

      console.log('[N8nStoryCreation] Envoi données enrichies à n8n:', {
        ...n8nData,
        storyPrompt: `${storyPrompt.substring(0, 100)}...` // Log tronqué pour la lisibilité
      });

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
        description: "La génération via n8n a été déclenchée avec le prompt complet. L'histoire apparaîtra dans votre bibliothèque une fois créée.",
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

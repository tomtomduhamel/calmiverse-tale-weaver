
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import type { Child } from '@/types/child';

interface N8nStoryRequest {
  childrenIds: string[];
  objective: string;
}

// Webhook de test n8n
const N8N_TEST_WEBHOOK = "https://tomtomduhamel.app.n8n.cloud/webhook-test/4cd35a66-3113-40a9-9e89-8f79ce59b44f";

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
- Créez une histoire de 1200 à 1500 mots
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

    setIsGenerating(true);

    try {
      console.log('[N8nStoryCreation] Déclenchement webhook n8n de test:', formData);

      // Récupérer les noms des enfants
      const childrenNames = formData.childrenIds.map(id => {
        const child = children.find(c => c.id === id);
        return child?.name || `Enfant-${id.slice(0, 8)}`;
      });

      // Générer le prompt complet pour l'histoire
      const storyPrompt = generateStoryPrompt(formData.objective, childrenNames);

      // Préparer les données pour n8n
      const n8nData = {
        userId: user.id,
        userEmail: user.email,
        objective: formData.objective,
        childrenNames,
        childrenIds: formData.childrenIds,
        storyPrompt, // Prompt complet pour la génération
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID().slice(0, 8)
      };

      console.log('[N8nStoryCreation] Envoi données à n8n test:', {
        ...n8nData,
        storyPrompt: `${storyPrompt.substring(0, 100)}...` // Log tronqué pour la lisibilité
      });

      // Appeler le webhook n8n de test
      const response = await fetch(N8N_TEST_WEBHOOK, {
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
      console.log('[N8nStoryCreation] Réponse n8n test:', result);

      toast({
        title: "Test de génération démarré",
        description: "Votre test d'automatisation n8n a été envoyé. Vérifiez votre workflow n8n pour confirmer la réception.",
      });

      return result;

    } catch (error: any) {
      console.error('[N8nStoryCreation] Erreur:', error);
      
      toast({
        title: "Erreur de test",
        description: error.message || "Impossible de déclencher le test n8n. Vérifiez votre webhook.",
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

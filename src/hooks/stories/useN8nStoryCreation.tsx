import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import type { Child } from '@/types/child';

interface N8nStoryRequest {
  childrenIds: string[];
  objective: string;
}

// Webhook n8n de test
const N8N_WEBHOOK = "https://tomtomduhamel.app.n8n.cloud/webhook-test/4cd35a66-3113-40a9-9e89-8f79ce59b44f";

// Fonction pour générer le prompt d'histoire complet
const generateStoryPrompt = (objective: string, childrenNames: string[]): string => {
  const childrenText = childrenNames.length === 1 
    ? childrenNames[0] 
    : `${childrenNames.slice(0, -1).join(', ')} et ${childrenNames[childrenNames.length - 1]}`;

  const objectivePrompts = {
    sleep: `Créer une histoire douce et apaisante pour aider ${childrenText} à s'endormir. L'histoire doit être calme, réconfortante et se terminer de manière paisible. Utilisez un langage simple et des images relaxantes. L'histoire doit utiliser les techniques d’hypnose ericksonienne pour permettre un endormissement apaisé et régénérateur.`,
    focus: `Créer une histoire engageante qui aide ${childrenText} à se concentrer. L'histoire doit captiver l'attention tout en étant éducative et stimulante intellectuellement.`,
    relax: `Créer une histoire relaxante pour aider ${childrenText} à se détendre. L'histoire doit être apaisante, avec un rythme lent et des éléments qui favorisent la relaxation.`,
    fun: `Créer une histoire amusante et divertissante pour ${childrenText}. L'histoire doit être joyeuse, pleine d'aventures et de moments ludiques qui feront sourire.`
  };

  const basePrompt = objectivePrompts[objective as keyof typeof objectivePrompts] || 
    `Créez une histoire personnalisée pour ${childrenText} avec pour objectif: ${objective}.`;

  return `${basePrompt}

Instructions pour la génération :
- Personnaliser l'histoire avec le(s) prénom(s) : ${childrenText}
- Adapter le vocabulaire et la complexité à l'âge des enfants
- Créer une histoire de 1200 à 1500 mots
- Structurer avec un début, un développement et une fin satisfaisante
- Inclure des éléments magiques ou imaginaires adaptés à l'enfance
- S'assurer que l'histoire respecte l'objectif : ${objective}
- Utiliser un ton bienveillant et positif
- Interdire tout contenu effrayant ou inapproprié

Générer maintenant l'histoire complète en français en t'assurant de respecter le nombre de mots demandés c'est-à-dire entre 1200 et 1500 mots.`;
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
      console.log('[N8nStoryCreation] Déclenchement webhook n8n de production:', formData);

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

  return {
    createStoryWithN8n,
    isGenerating
  };
};

export default useN8nStoryCreation;


import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface StoryCreationData {
  selectedTitle: string;
  objective: string;
  childrenIds: string[];
  childrenNames: string[];
}

// Fonction pour générer le prompt d'histoire complet (même que dans useN8nStoryCreation)
const generateStoryPrompt = (objective: string, childrenNames: string[], selectedTitle: string): string => {
  const childrenText = childrenNames.length === 1 
    ? childrenNames[0] 
    : `${childrenNames.slice(0, -1).join(', ')} et ${childrenNames[childrenNames.length - 1]}`;

  const objectivePrompts = {
    sleep: `Créer une histoire douce et apaisante pour aider ${childrenText} à s'endormir. L'histoire doit être calme, réconfortante et se terminer de manière paisible. Utilisez un langage simple et des images relaxantes. L'histoire doit utiliser les techniques d'hypnose ericksonienne pour permettre un endormissement apaisé et régénérateur.`,
    focus: `Créer une histoire engageante qui aide ${childrenText} à se concentrer. L'histoire doit captiver l'attention tout en étant éducative et stimulante intellectuellement.`,
    relax: `Créer une histoire relaxante pour aider ${childrenText} à se détendre. L'histoire doit être apaisante, avec un rythme lent et des éléments qui favorisent la relaxation.`,
    fun: `Créer une histoire amusante et divertissante pour ${childrenText}. L'histoire doit être joyeuse, pleine d'aventures et de moments ludiques qui feront sourire.`
  };

  const basePrompt = objectivePrompts[objective as keyof typeof objectivePrompts] || objectivePrompts.fun;
  return `${basePrompt} Le titre de l'histoire doit être : "${selectedTitle}". Assure-toi que l'histoire correspond bien à ce titre et développe le thème de manière créative et engageante.`;
};

export const useN8nStoryFromTitle = () => {
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const createStoryFromTitle = async (data: StoryCreationData): Promise<string> => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    setIsCreatingStory(true);
    
    try {
      console.log('[N8nStoryFromTitle] Création d\'histoire à partir du titre:', data);
      
      // Générer le prompt complet pour l'histoire
      const storyPrompt = generateStoryPrompt(data.objective, data.childrenNames, data.selectedTitle);
      console.log('[N8nStoryFromTitle] Prompt généré:', storyPrompt);
      
      // CORRECTION CRITIQUE: Utiliser le bon webhook de test
      const webhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook/067eebcf-cb13-4e1b-8b6b-b21e872c1d60';
      
      const payload = {
        action: 'create_story_from_title',
        selectedTitle: data.selectedTitle,
        objective: data.objective,
        childrenIds: data.childrenIds,
        childrenNames: data.childrenNames,
        userId: user.id,
        userEmail: user.email,
        storyPrompt, // Prompt complet pour la génération d'histoire
        requestType: 'story_creation'
      };

      console.log('[N8nStoryFromTitle] Envoi vers n8n avec payload:', payload);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('[N8nStoryFromTitle] Réponse n8n reçue:', result);

      // CORRECTION: Ne pas créer d'ID fictif, attendre que n8n nous confirme la création
      toast({
        title: "Histoire en cours de création",
        description: "Votre histoire personnalisée est en cours de génération via n8n",
      });

      // Retourner un identifiant temporaire pour le processus, pas un vrai storyId
      const processId = result.processId || result.workflowId || `process-${Date.now()}`;
      console.log('[N8nStoryFromTitle] Processus n8n lancé avec ID:', processId);
      
      return processId;
    } catch (error: any) {
      console.error('[N8nStoryFromTitle] Erreur:', error);
      
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer l'histoire via n8n",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsCreatingStory(false);
    }
  };

  return {
    createStoryFromTitle,
    isCreatingStory
  };
};


import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import type { Child } from '@/types/child';
import { generateAdvancedStoryPrompt } from '@/utils/storyPromptUtils';
import { calculateAge } from '@/utils/age';
import { estimateWordCountForDuration, StoryDurationMinutes } from '@/types/story';

interface StoryCreationData {
  selectedTitle: string;
  objective: string;
  childrenIds: string[];
  childrenNames: string[];
  childrenGenders: string[];
  children?: Child[]; // Nouvellement ajouté pour avoir accès aux données complètes
  durationMinutes?: StoryDurationMinutes;
}

// Ancienne fonction remplacée par generateAdvancedStoryPrompt dans storyPromptUtils.ts

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
      
      // Utiliser les données complètes des enfants si disponibles, sinon créer des objets basiques
      const childrenForPrompt = data.children || data.childrenNames.map((name, index) => ({
        id: data.childrenIds[index] || `temp-${index}`,
        name,
        gender: data.childrenGenders[index] || 'boy',
        birthDate: new Date(Date.now() - (5 * 365.25 * 24 * 60 * 60 * 1000)), // Default à 5 ans
        authorId: user.id
      })) as Child[];
      
      // Calculer les informations enrichies pour chaque enfant
      const enrichedChildrenData = childrenForPrompt.map(child => ({
        id: child.id,
        name: child.name,
        gender: child.gender,
        age: calculateAge(child.birthDate),
        teddyName: child.teddyName || null,
        teddyDescription: child.teddyDescription || null,
        imaginaryWorld: child.imaginaryWorld || null
      }));
      
      // Générer le prompt avancé avec titre, durée et contexte multi-personnages
      const targetWordCount = data.durationMinutes ? estimateWordCountForDuration(data.durationMinutes) : undefined;
      const storyPrompt = generateAdvancedStoryPrompt(
        data.objective,
        childrenForPrompt,
        data.selectedTitle,
        { durationMinutes: data.durationMinutes, targetWordCount }
      );
      console.log('[N8nStoryFromTitle] Prompt avancé généré:', storyPrompt.substring(0, 200) + '...');
      console.log('[N8nStoryFromTitle] Données enrichies des enfants:', enrichedChildrenData);
      
      // CORRECTION CRITIQUE: Utiliser le bon webhook pour la création d'histoire
      const webhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook-test/dca7a26f-c622-49cb-aae7-6f351312b99f';
      
      // Payload enrichi avec les informations complètes des enfants
      const payload = {
        action: 'create_story_from_title',
        selectedTitle: data.selectedTitle,
        objective: data.objective,
        childrenIds: data.childrenIds,
        childrenNames: data.childrenNames,
        childrenGenders: data.childrenGenders,
        // Nouvelles données enrichies
        childrenData: enrichedChildrenData,
        // Durée et longueur cible
        durationMinutes: data.durationMinutes ?? null,
        targetWordCount: targetWordCount ?? undefined,
        userId: user.id,
        userEmail: user.email,
        storyPrompt, // Prompt essentiel pour la génération
        timestamp: new Date().toISOString(),
        requestId: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
      // Pas de toast ici - sera géré par le composant appelant

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

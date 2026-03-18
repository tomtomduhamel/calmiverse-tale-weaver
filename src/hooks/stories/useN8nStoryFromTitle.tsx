import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useStoryNotifications } from '@/hooks/stories/useStoryNotifications';
import { fetchWithRetry, getErrorMessage } from '@/utils/retryUtils';
import type { Child } from '@/types/child';
import { generateAdvancedStoryPrompt } from '@/utils/storyPromptUtils';
import { calculateAge } from '@/utils/age';
import { estimateWordCountForDuration, StoryDurationMinutes } from '@/types/story';
import type { TitleCostData } from '@/hooks/stories/useN8nTitleGeneration';
import { useActivePrompts } from '@/hooks/prompts';
import { replacePromptVariables, OBJECTIVE_DESCRIPTIONS, getVocabularyInstructions, type PromptVariables } from '@/utils/promptVariables';
import { analyzeCharacters, generateCharacterContext } from '@/utils/storyPromptUtils';
import { useStoryVariation, type StoryVariation } from '@/hooks/stories/useStoryVariation';

interface StoryCreationData {
  selectedTitle: string;
  objective: string;
  childrenIds: string[];
  childrenNames: string[];
  childrenGenders: string[];
  children?: Child[]; // Nouvellement ajouté pour avoir accès aux données complètes
  durationMinutes?: StoryDurationMinutes;
  titleGenerationCost?: TitleCostData | null; // Coût de génération des titres
  generateVideo?: boolean; // 🆕 Drapeau pour n8n
}

/**
 * Génère le prompt à partir du template de la DB ou utilise le fallback
 */
const generatePromptFromTemplate = (
  template: string | undefined,
  data: StoryCreationData,
  childrenForPrompt: Child[],
  targetWordCount: number | undefined,
  variation?: StoryVariation
): string => {
  // Si pas de template, utiliser le fallback hardcodé
  if (!template) {
    console.log('[N8nStoryFromTitle] Pas de template DB, utilisation du fallback');
    return generateAdvancedStoryPrompt(
      data.objective,
      childrenForPrompt,
      data.selectedTitle,
      { durationMinutes: data.durationMinutes, targetWordCount }
    );
  }

  // Analyser les personnages
  const analysis = analyzeCharacters(childrenForPrompt);
  const characterContext = generateCharacterContext(analysis);

  // Construire les noms
  const allNames = [...analysis.children.map(c => c.child.name), ...analysis.pets.map(p => p.name)];
  const namesText = allNames.length === 1
    ? allNames[0]
    : `${allNames.slice(0, -1).join(', ')} et ${allNames[allNames.length - 1]}`;

  // Préparer les variables (existantes + nouvelles narratives)
  const variables: PromptVariables = {
    children_names: namesText,
    children_context: characterContext,
    objective: data.objective,
    objective_description: OBJECTIVE_DESCRIPTIONS[data.objective] || data.objective,
    vocabulary_level: getVocabularyInstructions(analysis.youngestAge),
    target_word_count: targetWordCount?.toString() || '1500',
    selected_title: data.selectedTitle,
    duration_minutes: data.durationMinutes?.toString() || '',
    youngest_age: analysis.youngestAge.toString(),
    oldest_age: analysis.oldestAge.toString(),
    average_age: analysis.averageAge.toString(),
    // Variables narratives depuis la sélection aléatoire
    narrative_schema: variation?.narrativeSchema?.type || '',
    narrative_mechanism: variation?.narrativeSchema?.mechanism || '',
    vakog_focus: variation?.vakogFocus?.sensory_type || '',
    vakog_keywords: variation?.vakogFocus?.sensory_keywords?.join(', ') || '',
    symbolic_universe: variation?.symbolicUniverse?.name || '',
    symbolic_description: variation?.symbolicUniverse?.description || '',
    symbolic_visual_style: variation?.symbolicUniverse?.visual_style || '',
    ericksonian_technique: variation?.ericksonianTechnique?.name || '',
    ericksonian_pattern: variation?.ericksonianTechnique?.linguistic_pattern || '',
    age_characteristics: variation?.ageCognition?.characteristics || '',
    age_preferred_supports: variation?.ageCognition?.preferred_supports?.join(', ') || '',
  };

  console.log('[N8nStoryFromTitle] Génération depuis template DB avec variables:', Object.keys(variables));

  return replacePromptVariables(template, variables);
};

export const useN8nStoryFromTitle = () => {
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { notifyStoryReady, notifyStoryError } = useStoryNotifications();
  const { prompts } = useActivePrompts();
  const { selectVariation } = useStoryVariation();

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
        imaginaryWorld: child.imaginaryWorld || null,
        petType: child.petType || null,
        petTypeCustom: child.petTypeCustom || null
      }));

      // Générer le prompt - priorité au template de la DB spécifique à l'objectif
      const targetWordCount = data.durationMinutes ? estimateWordCountForDuration(data.durationMinutes) : undefined;

      // Sélection aléatoire des ingrédients narratifs
      const analysis = analyzeCharacters(childrenForPrompt);
      const variation = selectVariation(analysis.youngestAge, data.objective);
      console.log('[N8nStoryFromTitle] Variation narrative sélectionnée:', {
        schema: variation.narrativeSchema?.type,
        vakog: variation.vakogFocus?.sensory_type,
        universe: variation.symbolicUniverse?.name,
        technique: variation.ericksonianTechnique?.name,
        ageCognition: variation.ageCognition?.range,
      });

      // Sélection dynamique du prompt selon l'objectif
      const promptKey = `story_prompt_${data.objective}` as keyof typeof prompts;
      let storyPromptTemplate = prompts?.[promptKey];

      // Log si pas de prompt spécifique trouvé (le fallback hardcodé sera utilisé)
      if (!storyPromptTemplate) {
        console.warn(`[N8nStoryFromTitle] ⚠️ Prompt spécifique '${promptKey}' non trouvé dans la DB`);
      }

      // Récupération du prompt d'image (nouvelle demande)
      const imageGenerationPrompt = prompts?.image_generation_prompt;
      if (!imageGenerationPrompt) {
        console.warn('[N8nStoryFromTitle] ⚠️ Prompt de génération d\'image non trouvé');
      }

      // Récupération du prompt de génération vidéo
      const videoGenerationPrompt = prompts?.video_generation_prompt;
      if (!videoGenerationPrompt) {
        console.warn('[N8nStoryFromTitle] ⚠️ Prompt de génération vidéo non trouvé');
      }

      // Log pour diagnostic
      if (!storyPromptTemplate) {
        console.warn('[N8nStoryFromTitle] ⚠️ Template DB non disponible (ni spécifique ni générique), utilisation du fallback hardcodé');
      }

      const storyPrompt = generatePromptFromTemplate(
        storyPromptTemplate,
        data,
        childrenForPrompt,
        targetWordCount,
        variation
      );

      const promptSource = storyPromptTemplate ? (prompts?.[promptKey] ? `database-${data.objective}` : 'database-generic') : 'fallback';
      console.log(`[N8nStoryFromTitle] Source du prompt: ${promptSource}`);
      console.log('[N8nStoryFromTitle] Prompt généré:', storyPrompt.substring(0, 200) + '...');
      console.log('[N8nStoryFromTitle] Données enrichies des enfants:', enrichedChildrenData);

      // CORRECTION CRITIQUE: Utiliser le bon webhook pour la création d'histoire
      const webhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook/816f3f78-bbdc-4b51-88b6-13232fcf3c78';

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
        storyPrompt, // Prompt généré (DB ou fallback)
        imageGenerationPrompt: imageGenerationPrompt || null, // Nouveau prompt image
        promptSource, // 🆕 Source du prompt pour debug
        // 🆕 Ingrédients narratifs sélectionnés aléatoirement
        narrativeVariation: {
          schema: variation.narrativeSchema?.type || null,
          vakog: variation.vakogFocus?.sensory_type || null,
          universe: variation.symbolicUniverse?.name || null,
          technique: variation.ericksonianTechnique?.name || null,
          ageCognition: variation.ageCognition?.range || null,
        },
        // 🆕 Coût de génération des titres pour calcul du coût total
        titleGenerationCost: data.titleGenerationCost || null,
        generateVideo: data.generateVideo ?? false, // 🆕 Envoyer le flag à n8n
        timestamp: new Date().toISOString(),
        requestId: `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      console.log('[N8nStoryFromTitle] Envoi vers n8n avec payload:', payload);

      const response = await fetchWithRetry(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }, {
        maxRetries: 3, // Plus de retries pour robustesse
        timeoutMs: 900000, // 15 minutes - timeout augmenté pour permettre la création complète
        retryCondition: (error) => {
          const msg = error?.message?.toLowerCase() || '';
          return msg.includes('timeout') || msg.includes('network') || msg.includes('connexion');
        }
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
        description: getErrorMessage(error, "création d'histoire"),
        variant: "destructive",
      });

      // 🚨 NOTIFICATION NATIVE : Erreur de création
      try {
        await notifyStoryError(data.selectedTitle, 'creation-error');
        console.log('[N8nStoryFromTitle] ✅ Notification d\'erreur envoyée');
      } catch (notifError) {
        console.warn('[N8nStoryFromTitle] ⚠️ Erreur notification:', notifError);
      }

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

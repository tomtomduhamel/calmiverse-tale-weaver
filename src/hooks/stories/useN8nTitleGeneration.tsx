
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface TitleGenerationData {
  objective: string;
  childrenIds: string[];
  childrenNames: string[];
}

interface GeneratedTitle {
  id: string;
  title: string;
  description?: string;
}

/**
 * Fonction pour parser la réponse de n8n et extraire les titres
 * Gère différents formats de réponse pour plus de robustesse
 */
const parseTitlesFromN8nResponse = (result: any): GeneratedTitle[] => {
  console.log('[N8nTitleGeneration] Réponse complète de n8n:', JSON.stringify(result, null, 2));
  
  let titles: GeneratedTitle[] = [];
  
  try {
    // Format 1: Array avec un objet output contenant "title 1", "title 2", "title 3"
    if (Array.isArray(result) && result.length > 0 && result[0].output) {
      const output = result[0].output;
      console.log('[N8nTitleGeneration] Format détecté: Array avec output object');
      
      // Extraire les titres depuis les propriétés "title 1", "title 2", "title 3"
      const titleKeys = Object.keys(output).filter(key => key.startsWith('title '));
      console.log('[N8nTitleGeneration] Clés de titres trouvées:', titleKeys);
      
      titleKeys.forEach((key, index) => {
        const titleText = output[key];
        if (titleText && typeof titleText === 'string') {
          titles.push({
            id: `title-${index + 1}-${Date.now()}`,
            title: titleText.trim(),
            description: `Titre généré automatiquement par l'IA`
          });
        }
      });
    }
    
    // Format 2: Objet direct avec propriétés title1, title2, title3
    else if (result.title1 && result.title2 && result.title3) {
      console.log('[N8nTitleGeneration] Format détecté: Objet avec title1, title2, title3');
      titles = [
        { id: `title-1-${Date.now()}`, title: result.title1.trim() },
        { id: `title-2-${Date.now()}`, title: result.title2.trim() },
        { id: `title-3-${Date.now()}`, title: result.title3.trim() }
      ];
    }
    
    // Format 3: Array de titres dans result.titles
    else if (result.titles && Array.isArray(result.titles)) {
      console.log('[N8nTitleGeneration] Format détecté: Array result.titles');
      titles = result.titles.map((title: any, index: number) => ({
        id: `title-${index}-${Date.now()}`,
        title: typeof title === 'string' ? title.trim() : title.title?.trim() || title.name?.trim(),
        description: typeof title === 'object' ? title.description : undefined
      }));
    }
    
    // Format 4: Titres directement dans un array
    else if (Array.isArray(result)) {
      console.log('[N8nTitleGeneration] Format détecté: Array direct de titres');
      titles = result.map((title: any, index: number) => ({
        id: `title-${index}-${Date.now()}`,
        title: typeof title === 'string' ? title.trim() : title.title?.trim() || title.name?.trim(),
        description: typeof title === 'object' ? title.description : undefined
      }));
    }

    console.log('[N8nTitleGeneration] Titres extraits:', titles);
    return titles.filter(title => title.title && title.title.length > 0);
    
  } catch (error) {
    console.error('[N8nTitleGeneration] Erreur lors du parsing des titres:', error);
    return [];
  }
};

export const useN8nTitleGeneration = () => {
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<GeneratedTitle[]>([]);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const generateTitles = async (data: TitleGenerationData): Promise<GeneratedTitle[]> => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    setIsGeneratingTitles(true);
    
    try {
      console.log('[N8nTitleGeneration] Envoi de la requête pour générer 3 titres:', data);
      
      const webhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook-test/067eebcf-cb13-4e1b-8b6b-b21e872c1d60';
      
      const payload = {
        action: 'generate_titles',
        objective: data.objective,
        childrenIds: data.childrenIds,
        childrenNames: data.childrenNames,
        userId: user.id,
        requestType: 'title_generation',
        timestamp: new Date().toISOString()
      };

      console.log('[N8nTitleGeneration] Payload envoyé:', JSON.stringify(payload, null, 2));

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[N8nTitleGeneration] Réponse brute reçue de n8n:', result);

      // Utiliser la nouvelle fonction de parsing
      const titles = parseTitlesFromN8nResponse(result);

      if (titles.length === 0) {
        console.error('[N8nTitleGeneration] Aucun titre valide trouvé dans la réponse');
        throw new Error('Aucun titre valide reçu de n8n. Vérifiez le format de la réponse.');
      }

      if (titles.length < 3) {
        console.warn(`[N8nTitleGeneration] Seulement ${titles.length} titre(s) reçu(s) au lieu de 3`);
      }

      // IMPORTANT: Mettre à jour l'état local avec les titres générés
      console.log('[N8nTitleGeneration] Mise à jour de l\'état local avec les titres:', titles);
      setGeneratedTitles(titles);
      
      toast({
        title: "Titres générés",
        description: `${titles.length} titre(s) d'histoires ont été créés avec succès`,
      });

      // Retourner les titres pour que le composant puisse les utiliser immédiatement
      return titles;
    } catch (error: any) {
      console.error('[N8nTitleGeneration] Erreur complète:', {
        message: error.message,
        stack: error.stack,
        userData: data,
        userId: user.id
      });
      
      // Vider les titres en cas d'erreur
      setGeneratedTitles([]);
      
      toast({
        title: "Erreur de génération",
        description: error.message || "Impossible de générer les titres d'histoires",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsGeneratingTitles(false);
    }
  };

  const clearTitles = () => {
    console.log('[N8nTitleGeneration] Effacement des titres');
    setGeneratedTitles([]);
  };

  // Log de l'état actuel pour débogage
  console.log('[N8nTitleGeneration] État du hook:', {
    generatedTitlesCount: generatedTitles.length,
    isGeneratingTitles,
    titlesPreview: generatedTitles.map(t => t.title).slice(0, 3)
  });

  return {
    generateTitles,
    clearTitles,
    generatedTitles,
    isGeneratingTitles
  };
};

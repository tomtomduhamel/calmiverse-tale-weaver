
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface TitleGenerationData {
  objective: string;
  childrenIds: string[];
  childrenNames: string[];
  childrenGenders: string[];
}

export interface GeneratedTitle {
  id: string;
  title: string;
  description?: string;
}

export const useN8nTitleGeneration = () => {
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<GeneratedTitle[]>([]);
  const { toast } = useToast();

  const parseN8nTitlesResponse = (rawResult: any): GeneratedTitle[] => {
    console.log('[N8nTitleGeneration] Structure brute de la réponse:', JSON.stringify(rawResult, null, 2));
    
    let result = rawResult;
    
    // CORRECTION CRITIQUE: Gérer le format array de n8n
    if (Array.isArray(rawResult)) {
      console.log('[N8nTitleGeneration] Détection format array - extraction du premier élément');
      result = rawResult[0];
      if (!result) {
        console.error('[N8nTitleGeneration] Array vide reçu de n8n');
        return [];
      }
    }
    
    console.log('[N8nTitleGeneration] Result après extraction array:', JSON.stringify(result, null, 2));
    
    let titles: GeneratedTitle[] = [];
    
    // Format 1: result.output.title_1/title_2/title_3 ou "title 1"/"title 2"/"title 3"
    if (result.output) {
      console.log('[N8nTitleGeneration] Détection du format output:', result.output);
      
      const outputTitles = [];
      for (let i = 1; i <= 3; i++) {
        // Essayer les différentes variantes de clés
        const titleKeyUnderscore = `title_${i}`;
        const titleKeySpace = `title ${i}`;
        
        if (result.output[titleKeyUnderscore]) {
          outputTitles.push(result.output[titleKeyUnderscore]);
          console.log(`[N8nTitleGeneration] Trouvé ${titleKeyUnderscore}:`, result.output[titleKeyUnderscore]);
        } else if (result.output[titleKeySpace]) {
          outputTitles.push(result.output[titleKeySpace]);
          console.log(`[N8nTitleGeneration] Trouvé ${titleKeySpace}:`, result.output[titleKeySpace]);
        } else {
          console.warn(`[N8nTitleGeneration] Titre ${i} non trouvé avec les clés ${titleKeyUnderscore} ou ${titleKeySpace}`);
        }
      }
      
      if (outputTitles.length > 0) {
        console.log('[N8nTitleGeneration] Titres extraits du format output:', outputTitles);
        titles = outputTitles.map((title, index) => ({
          id: `title-${index + 1}-${Date.now()}`,
          title: typeof title === 'string' ? title : title.title || title.name || String(title),
          description: typeof title === 'object' ? title.description : undefined
        }));
        
        // Validation : vérifier qu'on a au moins 1 titre valide
        const validTitles = titles.filter(t => t.title && t.title.trim().length > 0);
        if (validTitles.length === 0) {
          console.error('[N8nTitleGeneration] Aucun titre valide trouvé dans les titres extraits');
          return [];
        }
        
        return validTitles;
      }
    }
    
    // Format 2: result.titles (format array)
    if (result.titles && Array.isArray(result.titles)) {
      console.log('[N8nTitleGeneration] Détection du format titles array:', result.titles);
      titles = result.titles.map((title: any, index: number) => ({
        id: `title-${index}-${Date.now()}`,
        title: typeof title === 'string' ? title : title.title || title.name,
        description: typeof title === 'object' ? title.description : undefined
      }));
      return titles;
    }
    
    // Format 3: result.title1/title2/title3 (format direct)
    if (result.title1 && result.title2 && result.title3) {
      console.log('[N8nTitleGeneration] Détection du format title1/title2/title3');
      titles = [
        { id: `title-1-${Date.now()}`, title: result.title1 },
        { id: `title-2-${Date.now()}`, title: result.title2 },
        { id: `title-3-${Date.now()}`, title: result.title3 }
      ];
      return titles;
    }
    
    // Format 4: Tentative d'extraction de propriétés contenant "title"
    const titleKeys = Object.keys(result).filter(key => 
      key.toLowerCase().includes('title') && result[key]
    );
    
    if (titleKeys.length > 0) {
      console.log('[N8nTitleGeneration] Détection de clés contenant "title":', titleKeys);
      titles = titleKeys.slice(0, 3).map((key, index) => ({
        id: `title-${index}-${Date.now()}`,
        title: String(result[key])
      }));
      return titles;
    }
    
    console.error('[N8nTitleGeneration] ERREUR: Aucun format de titre reconnu dans:', result);
    console.error('[N8nTitleGeneration] Clés disponibles:', Object.keys(result));
    return [];
  };

  const generateTitles = async (data: TitleGenerationData): Promise<GeneratedTitle[]> => {
    setIsGeneratingTitles(true);
    
    try {
      console.log('[N8nTitleGeneration] Envoi de la requête pour générer 3 titres:', data);
      
      const webhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook/067eebcf-cb14-4e1b-8b6b-b21e872c1d60';
      
      const payload = {
        action: 'generate_titles',
        objective: data.objective,
        childrenIds: data.childrenIds,
        childrenNames: data.childrenNames,
        childrenGenders: data.childrenGenders,
        requestType: 'title_generation'
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
        const errorText = await response.text();
        console.error('[N8nTitleGeneration] Erreur HTTP:', response.status, errorText);
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[N8nTitleGeneration] Réponse brute reçue:', JSON.stringify(result, null, 2));

      // Utiliser le parser corrigé
      const titles = parseN8nTitlesResponse(result);

      if (titles.length === 0) {
        console.error('[N8nTitleGeneration] ÉCHEC: Aucun titre extrait de la réponse');
        throw new Error('Aucun titre reçu de n8n - format de réponse non reconnu');
      }

      console.log('[N8nTitleGeneration] SUCCÈS: Titres finaux extraits:', titles);
      setGeneratedTitles(titles);
      
      // Pas de toast ici - sera géré par le composant appelant
      return titles;
    } catch (error: any) {
      console.error('[N8nTitleGeneration] Erreur complète:', error);
      
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
    setGeneratedTitles([]);
  };

  return {
    generateTitles,
    clearTitles,
    generatedTitles,
    isGeneratingTitles
  };
};

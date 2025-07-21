
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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

export const useN8nTitleGeneration = () => {
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<GeneratedTitle[]>([]);
  const { toast } = useToast();

  const parseN8nTitlesResponse = (result: any): GeneratedTitle[] => {
    console.log('[N8nTitleGeneration] Structure complète de la réponse:', JSON.stringify(result, null, 2));
    
    let titles: GeneratedTitle[] = [];
    
    // Format 1: result.output.title_1/title_2/title_3 ou title 1/title 2/title 3 (format actuel de n8n)
    if (result.output) {
      console.log('[N8nTitleGeneration] Détection du format output:', result.output);
      
      const outputTitles = [];
      for (let i = 1; i <= 3; i++) {
        // Essayer d'abord avec underscore, puis avec espace
        const titleKeyUnderscore = `title_${i}`;
        const titleKeySpace = `title ${i}`;
        
        if (result.output[titleKeyUnderscore]) {
          outputTitles.push(result.output[titleKeyUnderscore]);
        } else if (result.output[titleKeySpace]) {
          outputTitles.push(result.output[titleKeySpace]);
        }
      }
      
      if (outputTitles.length > 0) {
        console.log('[N8nTitleGeneration] Titres extraits du format output:', outputTitles);
        titles = outputTitles.map((title, index) => ({
          id: `title-${index + 1}-${Date.now()}`,
          title: typeof title === 'string' ? title : title.title || title.name || String(title),
          description: typeof title === 'object' ? title.description : undefined
        }));
        return titles;
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
    
    console.warn('[N8nTitleGeneration] Aucun format de titre reconnu dans:', result);
    return [];
  };

  const generateTitles = async (data: TitleGenerationData): Promise<GeneratedTitle[]> => {
    setIsGeneratingTitles(true);
    
    try {
      console.log('[N8nTitleGeneration] Envoi de la requête pour générer 3 titres:', data);
      
      const webhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook-test/067eebcf-cb13-4e1b-8b6b-b21e872c1d60';
      
      const payload = {
        action: 'generate_titles',
        objective: data.objective,
        childrenIds: data.childrenIds,
        childrenNames: data.childrenNames,
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

      // Utiliser le nouveau parser universel
      const titles = parseN8nTitlesResponse(result);

      if (titles.length === 0) {
        console.error('[N8nTitleGeneration] Aucun titre extrait de la réponse');
        throw new Error('Aucun titre reçu de n8n - format de réponse non reconnu');
      }

      console.log('[N8nTitleGeneration] Titres finaux extraits:', titles);
      setGeneratedTitles(titles);
      
      toast({
        title: "Titres générés",
        description: `${titles.length} titres d'histoires ont été créés avec succès`,
      });

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

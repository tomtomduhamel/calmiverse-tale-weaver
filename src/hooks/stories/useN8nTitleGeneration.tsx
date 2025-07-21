
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

  const generateTitles = async (data: TitleGenerationData): Promise<GeneratedTitle[]> => {
    setIsGeneratingTitles(true);
    
    try {
      console.log('[N8nTitleGeneration] Envoi de la requête pour générer 3 titres:', data);
      
      const webhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook/067eebcf-cb13-4e1b-8b6b-b21e872c1d60';
      
      const payload = {
        action: 'generate_titles',
        objective: data.objective,
        childrenIds: data.childrenIds,
        childrenNames: data.childrenNames,
        requestType: 'title_generation'
      };

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
      console.log('[N8nTitleGeneration] Réponse reçue:', result);

      // Traiter la réponse de n8n pour extraire les 3 titres
      let titles: GeneratedTitle[] = [];
      
      if (result.titles && Array.isArray(result.titles)) {
        titles = result.titles.map((title: any, index: number) => ({
          id: `title-${index}-${Date.now()}`,
          title: typeof title === 'string' ? title : title.title || title.name,
          description: typeof title === 'object' ? title.description : undefined
        }));
      } else if (result.title1 && result.title2 && result.title3) {
        // Format alternatif si n8n renvoie title1, title2, title3
        titles = [
          { id: `title-1-${Date.now()}`, title: result.title1 },
          { id: `title-2-${Date.now()}`, title: result.title2 },
          { id: `title-3-${Date.now()}`, title: result.title3 }
        ];
      }

      if (titles.length === 0) {
        throw new Error('Aucun titre reçu de n8n');
      }

      setGeneratedTitles(titles);
      
      toast({
        title: "Titres généres",
        description: `${titles.length} titres d'histoires ont été créés avec succès`,
      });

      return titles;
    } catch (error: any) {
      console.error('[N8nTitleGeneration] Erreur:', error);
      
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

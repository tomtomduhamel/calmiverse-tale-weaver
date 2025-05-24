
import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FallbackStoryParams {
  objective: string;
  childrenNames: string[];
  storyId?: string;
}

export const usePostgreSQLFallback = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateStoryWithFallback = useCallback(async (params: FallbackStoryParams) => {
    setIsGenerating(true);
    
    try {
      console.log('🐘 [PostgreSQL Fallback] Début génération histoire fallback');
      
      const { objective, childrenNames, storyId } = params;
      
      // Étape 1: Créer ou mettre à jour l'histoire en base
      let currentStoryId = storyId;
      
      if (!currentStoryId) {
        const { data: newStory, error: insertError } = await supabase
          .from('stories')
          .insert({
            title: `Histoire en cours pour ${childrenNames.join(' et ')}`,
            content: '',
            summary: 'Génération en cours via PostgreSQL fallback...',
            preview: 'Histoire en cours de génération...',
            status: 'pending',
            objective,
            childrennames: childrenNames
          })
          .select()
          .single();
          
        if (insertError) throw insertError;
        currentStoryId = newStory.id;
        console.log('🐘 [PostgreSQL Fallback] Histoire créée:', currentStoryId);
      }
      
      // Étape 2: Générer le contenu via fallback client-side
      const fallbackContent = await generateContentClientSide(objective, childrenNames);
      
      // Étape 3: Mettre à jour l'histoire avec le contenu généré
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          title: fallbackContent.title,
          content: fallbackContent.content,
          summary: fallbackContent.summary,
          preview: fallbackContent.preview,
          status: 'completed'
        })
        .eq('id', currentStoryId);
        
      if (updateError) throw updateError;
      
      console.log('✅ [PostgreSQL Fallback] Histoire générée avec succès:', currentStoryId);
      
      toast({
        title: "Histoire générée avec succès",
        description: "Système de fallback PostgreSQL utilisé",
      });
      
      return currentStoryId;
      
    } catch (error: any) {
      console.error('❌ [PostgreSQL Fallback] Erreur:', error);
      
      toast({
        title: "Erreur de génération",
        description: error.message || "Impossible de générer l'histoire avec le fallback",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const checkFallbackMode = useCallback(() => {
    return localStorage.getItem('calmi-fallback-mode') === 'postgresql';
  }, []);

  const activateFallbackMode = useCallback(() => {
    localStorage.setItem('calmi-fallback-mode', 'postgresql');
    console.log('🐘 [PostgreSQL Fallback] Mode fallback activé');
  }, []);

  const deactivateFallbackMode = useCallback(() => {
    localStorage.removeItem('calmi-fallback-mode');
    console.log('🐘 [PostgreSQL Fallback] Mode fallback désactivé');
  }, []);

  return {
    generateStoryWithFallback,
    isGenerating,
    checkFallbackMode,
    activateFallbackMode,
    deactivateFallbackMode,
    isFallbackMode: checkFallbackMode()
  };
};

// Fonction de génération de contenu côté client (fallback)
async function generateContentClientSide(objective: string, childrenNames: string[]): Promise<{
  title: string;
  content: string;
  summary: string;
  preview: string;
}> {
  console.log('🎯 [Content Generation] Génération côté client pour:', { objective, childrenNames });
  
  // Templates d'histoires basés sur l'objectif
  const storyTemplates = {
    sleep: {
      title: `L'aventure apaisante de ${childrenNames.join(' et ')}`,
      opening: "Il était une fois, dans un monde doux et paisible",
      theme: "relaxation et sommeil",
      ending: "Et ils s'endormirent paisiblement, bercés par cette belle aventure."
    },
    focus: {
      title: `${childrenNames.join(' et ')} découvrent la concentration`,
      opening: "Dans un jardin secret où tout était calme",
      theme: "concentration et attention",
      ending: "Grâce à cette aventure, ils avaient appris à se concentrer."
    },
    relax: {
      title: `La détente magique de ${childrenNames.join(' et ')}`,
      opening: "Sur une plage aux sables dorés",
      theme: "détente et bien-être",
      ending: "Ils se sentirent complètement détendus et sereins."
    },
    fun: {
      title: `Les joyeuses aventures de ${childrenNames.join(' et ')}`,
      opening: "Dans un monde coloré plein de surprises",
      theme: "joie et amusement",
      ending: "Et ils rirent aux éclats, heureux de cette belle aventure."
    }
  };

  const template = storyTemplates[objective as keyof typeof storyTemplates] || storyTemplates.fun;
  
  // Générer le contenu personnalisé
  const content = `${template.opening}, ${childrenNames.join(' et ')} découvrirent un monde merveilleux.

Ensemble, ils explorèrent ce lieu magique où tout était possible. Chaque pas les menait vers de nouvelles découvertes, chaque sourire illuminait leur chemin.

${childrenNames[0]} remarqua des étoiles scintillantes qui dansaient dans le ciel. ${childrenNames.length > 1 ? childrenNames[1] + ' découvrit' : 'Il découvrit'} des fleurs aux couleurs extraordinaires qui chantaient doucement.

Au fil de leur voyage, ils apprirent l'importance de ${template.theme}. Chaque moment partagé renforçait leur amitié et leur confiance.

Les créatures bienveillantes qu'ils rencontrèrent leur enseignèrent de précieuses leçons sur la vie, l'amitié et le courage.

${template.ending}

Cette histoire a été créée spécialement pour ${childrenNames.join(' et ')}, avec tout l'amour du monde.`;

  const summary = `Une belle histoire de ${template.theme} mettant en scène ${childrenNames.join(' et ')} dans une aventure personnalisée.`;
  
  const preview = content.substring(0, 200) + "...";

  // Simuler un délai de génération pour une expérience réaliste
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    title: template.title,
    content,
    summary,
    preview
  };
}

export default usePostgreSQLFallback;

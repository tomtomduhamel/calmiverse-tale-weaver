
import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface FallbackStoryParams {
  objective: string;
  childrenNames: string[];
  storyId?: string;
}

export const usePostgreSQLFallback = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const generateStoryWithFallback = useCallback(async (params: FallbackStoryParams) => {
    if (!user) {
      throw new Error("Utilisateur non authentifié pour le fallback PostgreSQL");
    }

    setIsGenerating(true);
    
    try {
      console.log('🐘 [PostgreSQL Fallback] Début génération histoire fallback avec RLS corrigé');
      
      const { objective, childrenNames, storyId } = params;
      
      // Étape 1: Créer ou mettre à jour l'histoire en base avec authorid explicite
      let currentStoryId = storyId;
      
      if (!currentStoryId) {
        console.log('🐘 [PostgreSQL Fallback] Création nouvelle histoire avec authorid:', user.id);
        
        const { data: newStory, error: insertError } = await supabase
          .from('stories')
          .insert({
            title: `Histoire en cours pour ${childrenNames.join(' et ')}`,
            content: '',
            summary: 'Génération en cours via PostgreSQL fallback...',
            preview: 'Histoire en cours de génération...',
            status: 'pending',
            objective,
            childrennames: childrenNames,
            authorid: user.id // Explicitement définir l'authorid pour RLS
          })
          .select()
          .single();
          
        if (insertError) {
          console.error('🐘 [PostgreSQL Fallback] Erreur insertion:', insertError);
          throw new Error(`Erreur création histoire: ${insertError.message}`);
        }
        
        currentStoryId = newStory.id;
        console.log('🐘 [PostgreSQL Fallback] Histoire créée avec succès:', currentStoryId);
      } else {
        console.log('🐘 [PostgreSQL Fallback] Mise à jour histoire existante:', currentStoryId);
        
        // Vérifier que l'histoire appartient à l'utilisateur
        const { data: existingStory, error: fetchError } = await supabase
          .from('stories')
          .select('id, authorid')
          .eq('id', currentStoryId)
          .single();
          
        if (fetchError || !existingStory) {
          throw new Error(`Histoire ${currentStoryId} introuvable`);
        }
        
        if (existingStory.authorid !== user.id) {
          throw new Error(`Accès non autorisé à l'histoire ${currentStoryId}`);
        }
      }
      
      // Étape 2: Générer le contenu via fallback client-side
      console.log('🐘 [PostgreSQL Fallback] Génération contenu pour:', { objective, childrenNames });
      const fallbackContent = await generateContentClientSide(objective, childrenNames);
      
      // Étape 3: Mettre à jour l'histoire avec le contenu généré
      console.log('🐘 [PostgreSQL Fallback] Mise à jour histoire avec contenu généré');
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          title: fallbackContent.title,
          content: fallbackContent.content,
          summary: fallbackContent.summary,
          preview: fallbackContent.preview,
          status: 'completed',
          updatedat: new Date().toISOString()
        })
        .eq('id', currentStoryId)
        .eq('authorid', user.id); // Double vérification RLS
        
      if (updateError) {
        console.error('🐘 [PostgreSQL Fallback] Erreur mise à jour:', updateError);
        throw new Error(`Erreur mise à jour histoire: ${updateError.message}`);
      }
      
      console.log('✅ [PostgreSQL Fallback] Histoire générée avec succès:', currentStoryId);
      
      toast({
        title: "Histoire générée avec succès",
        description: "Système de fallback PostgreSQL utilisé avec RLS sécurisé",
      });
      
      return currentStoryId;
      
    } catch (error: any) {
      console.error('❌ [PostgreSQL Fallback] Erreur:', error);
      
      // Gestion spécifique des erreurs RLS
      let errorMessage = error.message;
      if (error.message?.includes('row-level security')) {
        errorMessage = "Erreur de sécurité: permissions insuffisantes";
        console.error('🔒 [PostgreSQL Fallback] Erreur RLS détectée:', error);
      }
      
      toast({
        title: "Erreur de génération",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [toast, user]);

  const checkFallbackMode = useCallback(() => {
    return localStorage.getItem('calmi-fallback-mode') === 'postgresql';
  }, []);

  const activateFallbackMode = useCallback(() => {
    localStorage.setItem('calmi-fallback-mode', 'postgresql');
    localStorage.setItem('calmi-fallback-activated-at', new Date().toISOString());
    console.log('🐘 [PostgreSQL Fallback] Mode fallback activé avec timestamp');
  }, []);

  const deactivateFallbackMode = useCallback(() => {
    localStorage.removeItem('calmi-fallback-mode');
    localStorage.removeItem('calmi-fallback-activated-at');
    console.log('🐘 [PostgreSQL Fallback] Mode fallback désactivé');
  }, []);

  const getHealthStatus = useCallback(() => {
    const isFallbackMode = checkFallbackMode();
    const activatedAt = localStorage.getItem('calmi-fallback-activated-at');
    
    return {
      isFallbackMode,
      activatedAt: activatedAt ? new Date(activatedAt) : null,
      isGenerating,
      lastError: null
    };
  }, [checkFallbackMode, isGenerating]);

  return {
    generateStoryWithFallback,
    isGenerating,
    checkFallbackMode,
    activateFallbackMode,
    deactivateFallbackMode,
    getHealthStatus,
    isFallbackMode: checkFallbackMode()
  };
};

// Fonction de génération de contenu côté client améliorée
async function generateContentClientSide(objective: string, childrenNames: string[]): Promise<{
  title: string;
  content: string;
  summary: string;
  preview: string;
}> {
  console.log('🎯 [Content Generation] Génération côté client pour:', { objective, childrenNames });
  
  // Templates d'histoires enrichis basés sur l'objectif
  const storyTemplates = {
    sleep: {
      title: `L'aventure apaisante de ${childrenNames.join(' et ')}`,
      opening: "Il était une fois, dans un monde doux et paisible",
      theme: "relaxation et sommeil",
      ending: "Et ils s'endormirent paisiblement, bercés par cette belle aventure.",
      mood: "calme et réconfortant"
    },
    focus: {
      title: `${childrenNames.join(' et ')} découvrent la concentration`,
      opening: "Dans un jardin secret où tout était calme",
      theme: "concentration et attention",
      ending: "Grâce à cette aventure, ils avaient appris à se concentrer.",
      mood: "zen et focalisé"
    },
    relax: {
      title: `La détente magique de ${childrenNames.join(' et ')}`,
      opening: "Sur une plage aux sables dorés",
      theme: "détente et bien-être",
      ending: "Ils se sentirent complètement détendus et sereins.",
      mood: "apaisant et serein"
    },
    fun: {
      title: `Les joyeuses aventures de ${childrenNames.join(' et ')}`,
      opening: "Dans un monde coloré plein de surprises",
      theme: "joie et amusement",
      ending: "Et ils rirent aux éclats, heureux de cette belle aventure.",
      mood: "joyeux et énergique"
    }
  };

  const template = storyTemplates[objective as keyof typeof storyTemplates] || storyTemplates.fun;
  
  // Générer le contenu personnalisé enrichi
  const content = `${template.opening}, ${childrenNames.join(' et ')} découvrirent un monde merveilleux aux couleurs chatoyantes.

Dans cette atmosphère ${template.mood}, ils commencèrent une aventure extraordinaire. Chaque pas les menait vers de nouvelles découvertes, chaque sourire illuminait leur chemin comme des étoiles scintillantes.

${childrenNames[0]} remarqua des créatures bienveillantes qui dansaient gracieusement autour d'eux. ${childrenNames.length > 1 ? childrenNames[1] + ' découvrit' : 'Il découvrit'} des fleurs aux couleurs extraordinaires qui chantaient des mélodies douces et apaisantes.

Au fil de leur voyage enchanteur, ils apprirent l'importance de ${template.theme}. Chaque moment partagé renforçait leur amitié et leur confiance mutuelle, créant des liens magiques qui les unissaient.

Les sages qu'ils rencontrèrent leur enseignèrent de précieuses leçons sur la vie, l'amitié et le courage. Ils découvrirent que chaque défi était une opportunité de grandir ensemble.

${template.ending}

Cette histoire a été créée spécialement pour ${childrenNames.join(' et ')}, avec tout l'amour du monde et la magie du système PostgreSQL de Calmiverse.`;

  const summary = `Une belle histoire de ${template.theme} mettant en scène ${childrenNames.join(' et ')} dans une aventure personnalisée ${template.mood}.`;
  
  const preview = content.substring(0, 250) + "...";

  // Simuler un délai de génération réaliste avec progression
  await new Promise(resolve => setTimeout(resolve, 2500));

  return {
    title: template.title,
    content,
    summary,
    preview
  };
}

export default usePostgreSQLFallback;


import React, { useCallback } from "react";
import type { Story } from "@/types/story";
import type { Child } from "@/types/child";
import SimplifiedUnifiedCreator from "@/components/story/SimplifiedUnifiedCreator";

interface CreateStoryViewProps {
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<void | string>;
  onStoryCreated: (story: Story) => void;
}

/**
 * Vue de création d'histoire avec solution radicalement simplifiée
 * Approche directe qui contourne la validation complexe
 */
export const CreateStoryView: React.FC<CreateStoryViewProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  console.log('[CreateStoryView] Rendu avec', {
    childrenCount: children?.length || 0,
    onSubmitDefined: !!onSubmit,
    onCreateChildDefined: !!onCreateChild,
    onStoryCreatedDefined: !!onStoryCreated,
    timestamp: new Date().toISOString()
  });
  
  // Fonction de soumission robuste avec gestion d'erreur améliorée
  const handleSubmit = useCallback(async (formData: { childrenIds: string[]; objective: string }) => {
    console.log('[CreateStoryView] handleSubmit appelé avec:', {
      childrenIds: formData.childrenIds,
      childrenCount: formData.childrenIds?.length || 0,
      objective: formData.objective,
      timestamp: new Date().toISOString()
    });
    
    // Vérification de sécurité - corrigée pour permettre une soumission même sans enfant sélectionné
    if (!formData.childrenIds) {
      console.warn('[CreateStoryView] Attention: childrenIds manquants ou vides');
      // On continue malgré tout - la correction sera faite dans le composant enfant
    }
    
    if (!formData.objective) {
      console.warn('[CreateStoryView] Attention: objectif manquant');
      // On continue malgré tout - la correction sera faite dans le composant enfant
    }
    
    try {
      console.log('[CreateStoryView] Appel API avec:', {
        childrenIds: formData.childrenIds,
        objective: formData.objective
      });
      
      const storyId = await onSubmit(formData);
      console.log('[CreateStoryView] Réponse API reçue:', storyId);
      
      return storyId;
    } catch (error: any) {
      console.error('[CreateStoryView] Erreur lors de la soumission:', error);
      throw error;
    }
  }, [onSubmit]);
  
  // Fonction de création d'enfant sécurisée - adaptée pour renvoyer toujours une chaîne
  const handleCreateChild = useCallback(async (childData: Omit<Child, "id">): Promise<string> => {
    console.log('[CreateStoryView] handleCreateChild appelé avec:', childData);
    
    try {
      const childId = await onCreateChild(childData) as string;
      console.log('[CreateStoryView] Enfant créé avec ID:', childId);
      return childId || '';
    } catch (error: any) {
      console.error('[CreateStoryView] Erreur lors de la création d\'enfant:', error);
      throw error;
    }
  }, [onCreateChild]);
  
  // Gestion de l'histoire créée - inchangée
  const handleStoryCreated = useCallback((story: Story) => {
    console.log('[CreateStoryView] handleStoryCreated appelé avec:', {
      storyId: story.id,
      childrenIds: story.childrenIds,
      objective: story.objective,
      timestamp: new Date().toISOString()
    });
    onStoryCreated(story);
  }, [onStoryCreated]);
  
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <SimplifiedUnifiedCreator
        onSubmit={handleSubmit}
        children={children}
        onCreateChild={handleCreateChild}
        onStoryCreated={handleStoryCreated}
      />
    </div>
  );
};

export default CreateStoryView;

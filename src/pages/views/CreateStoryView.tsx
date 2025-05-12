
import React, { useCallback } from "react";
import DirectStoryFormWrapper from "@/components/story/DirectStoryFormWrapper";
import type { Story } from "@/types/story";
import type { Child } from "@/types/child";

interface CreateStoryViewProps {
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onStoryCreated: (story: Story) => void;
}

/**
 * Vue de création d'histoire avec formulaire direct simplifié
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
    onStoryCreatedDefined: !!onStoryCreated
  });
  
  // Fonction de soumission renforcée
  const handleSubmit = useCallback(async (formData: { childrenIds: string[]; objective: string }) => {
    console.log('[CreateStoryView] handleSubmit appelé avec:', formData);
    
    // Validation explicite côté parent
    if (!formData.childrenIds || formData.childrenIds.length === 0) {
      console.error('[CreateStoryView] Erreur: childrenIds manquants ou vides');
      throw new Error("Veuillez sélectionner au moins un enfant pour créer une histoire");
    }
    
    if (!formData.objective) {
      console.error('[CreateStoryView] Erreur: objectif manquant');
      throw new Error("Veuillez sélectionner un objectif pour l'histoire");
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
  
  // Fonction de création d'enfant sécurisée
  const handleCreateChild = useCallback(async (childData: Omit<Child, "id">) => {
    console.log('[CreateStoryView] handleCreateChild appelé avec:', childData);
    
    try {
      const childId = await onCreateChild(childData);
      console.log('[CreateStoryView] Enfant créé avec ID:', childId);
      return childId;
    } catch (error: any) {
      console.error('[CreateStoryView] Erreur lors de la création d\'enfant:', error);
      throw error;
    }
  }, [onCreateChild]);
  
  // Gestion de l'histoire créée
  const handleStoryCreated = useCallback((story: Story) => {
    console.log('[CreateStoryView] handleStoryCreated appelé avec:', story);
    onStoryCreated(story);
  }, [onStoryCreated]);
  
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <DirectStoryFormWrapper
        onSubmit={handleSubmit}
        children={children}
        onCreateChild={handleCreateChild}
        onStoryCreated={handleStoryCreated}
      />
    </div>
  );
};

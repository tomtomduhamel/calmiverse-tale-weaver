
import React, { useEffect, useState } from "react";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { Loader2 } from "lucide-react";
import RobustDirectStoryForm from "./RobustDirectStoryForm";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";

interface RobustDirectStoryFormWrapperProps {
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onStoryCreated: (story: Story) => void;
}

/**
 * Wrapper robuste pour le formulaire direct qui gère le chargement des objectifs
 * avec traçage complet et mécanismes de récupération
 */
const RobustDirectStoryFormWrapper: React.FC<RobustDirectStoryFormWrapperProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated
}) => {
  // État local pour la journalisation
  const [renderCount, setRenderCount] = useState(0);
  
  // Charger les objectifs
  const { objectives, isLoading, error } = useStoryObjectives();
  
  // Journaliser chaque rendu
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log("[RobustDirectStoryFormWrapper] Rendu #" + (renderCount + 1), {
      childrenCount: children?.length || 0,
      objectivesLoaded: objectives?.length || 0,
      isLoading,
      hasError: !!error,
      timestamp: new Date().toISOString()
    });
  }, [children, objectives, isLoading, error, renderCount]);
  
  // Objectifs par défaut si le chargement échoue
  const defaultObjectives = [
    { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
    { id: "focus", label: "Se concentrer", value: "focus" },
    { id: "relax", label: "Se relaxer", value: "relax" },
    { id: "fun", label: "S'amuser", value: "fun" },
  ];

  // Fonction de soumission avec journalisation renforcée
  const handleSubmit = async (formData: { childrenIds: string[]; objective: string }) => {
    console.log("[RobustDirectStoryFormWrapper] Soumission reçue:", formData);
    
    // Validation explicite
    if (!formData.childrenIds || formData.childrenIds.length === 0) {
      console.error("[RobustDirectStoryFormWrapper] Erreur: childrenIds manquants ou vides");
      throw new Error("Veuillez sélectionner au moins un enfant pour créer une histoire");
    }
    
    if (!formData.objective) {
      console.error("[RobustDirectStoryFormWrapper] Erreur: objectif manquant");
      throw new Error("Veuillez sélectionner un objectif pour l'histoire");
    }
    
    try {
      // Appel à l'API avec journalisation complète
      console.log("[RobustDirectStoryFormWrapper] Appel API:", formData);
      const storyId = await onSubmit(formData);
      console.log("[RobustDirectStoryFormWrapper] Réponse API:", storyId);
      return storyId;
    } catch (error) {
      console.error("[RobustDirectStoryFormWrapper] Erreur API:", error);
      throw error;
    }
  };

  // Gérer l'état de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Chargement des objectifs...</p>
        </div>
      </div>
    );
  }
  
  // Utiliser les objectifs chargés ou les objectifs par défaut
  const objectivesToUse = objectives && objectives.length > 0 ? objectives : defaultObjectives;
  
  console.log("[RobustDirectStoryFormWrapper] Rendu du formulaire avec", objectivesToUse.length, "objectifs");
  
  return (
    <RobustDirectStoryForm
      children={children}
      objectives={objectivesToUse}
      onCreateChild={onCreateChild}
      onSubmit={handleSubmit}
      onStoryCreated={onStoryCreated}
    />
  );
};

export default RobustDirectStoryFormWrapper;

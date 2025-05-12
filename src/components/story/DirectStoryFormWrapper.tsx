
import React from "react";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { Loader2 } from "lucide-react";
import DirectStoryForm from "./DirectStoryForm";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";

interface DirectStoryFormWrapperProps {
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onStoryCreated: (story: Story) => void;
}

/**
 * Wrapper pour le formulaire direct qui gère le chargement des objectifs
 */
const DirectStoryFormWrapper: React.FC<DirectStoryFormWrapperProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated
}) => {
  // Charger les objectifs
  const { objectives, isLoading, error } = useStoryObjectives();
  
  console.log("[DirectStoryFormWrapper] Rendu avec", {
    childrenCount: children?.length || 0,
    objectivesLoaded: objectives?.length || 0,
    isLoading,
    hasError: !!error
  });
  
  // Objectifs par défaut si le chargement échoue
  const defaultObjectives = [
    { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
    { id: "focus", label: "Se concentrer", value: "focus" },
    { id: "relax", label: "Se relaxer", value: "relax" },
    { id: "fun", label: "S'amuser", value: "fun" },
  ];

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
  
  // Gérer l'état d'erreur
  if (error) {
    console.error("[DirectStoryFormWrapper] Erreur de chargement des objectifs:", error);
    // Utiliser les objectifs par défaut en cas d'erreur
  }
  
  // Utiliser les objectifs chargés ou les objectifs par défaut
  const objectivesToUse = objectives && objectives.length > 0 ? objectives : defaultObjectives;
  
  return (
    <DirectStoryForm
      children={children}
      objectives={objectivesToUse}
      onCreateChild={onCreateChild}
      onSubmit={onSubmit}
      onStoryCreated={onStoryCreated}
    />
  );
};

export default DirectStoryFormWrapper;

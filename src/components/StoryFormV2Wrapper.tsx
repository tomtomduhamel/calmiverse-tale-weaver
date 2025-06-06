
import React from "react";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { Loader2 } from "lucide-react";
import StoryFormV2 from "./story/form/StoryFormV2";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";

interface StoryFormV2WrapperProps {
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild: () => void;
  onStoryCreated: (story: Story) => void;
}

/**
 * Wrapper pour StoryFormV2 qui gère le chargement des objectifs
 */
const StoryFormV2Wrapper: React.FC<StoryFormV2WrapperProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated
}) => {
  // Charger les objectifs
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  
  // Objectifs par défaut si le chargement échoue
  const defaultObjectives = [
    { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
    { id: "focus", label: "Se concentrer", value: "focus" },
    { id: "relax", label: "Se relaxer", value: "relax" },
    { id: "fun", label: "S'amuser", value: "fun" },
  ];

  // Afficher un indicateur de chargement pendant le chargement des objectifs
  if (objectivesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Chargement des objectifs...</p>
        </div>
      </div>
    );
  }
  
  return (
    <StoryFormV2
      children={children}
      objectives={objectives || defaultObjectives}
      onCreateChild={onCreateChild}
      onSubmit={onSubmit}
      onStoryCreated={onStoryCreated}
    />
  );
};

export default StoryFormV2Wrapper;

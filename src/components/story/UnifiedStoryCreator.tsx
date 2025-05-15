
import React from "react";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";
import SimplifiedUnifiedCreator from "./SimplifiedUnifiedCreator";

interface UnifiedStoryCreatorProps {
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onStoryCreated: (story: Story) => void;
}

/**
 * Cette version agit comme un wrapper/adaptateur pour le nouveau SimplifiedUnifiedCreator
 * afin d'assurer une transition en douceur
 */
const UnifiedStoryCreator: React.FC<UnifiedStoryCreatorProps> = (props) => {
  console.log("[UnifiedStoryCreator] Rendu avec", {
    childrenCount: props.children?.length || 0,
    timestamp: new Date().toISOString()
  });

  // Passer simplement toutes les props au nouveau composant simplifié
  return <SimplifiedUnifiedCreator {...props} />;
};

export default UnifiedStoryCreator;

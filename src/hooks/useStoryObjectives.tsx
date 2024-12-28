import { useState, useEffect } from "react";

export interface StoryObjective {
  id: string;
  value: string;
}

export const useStoryObjectives = () => {
  const [objectives, setObjectives] = useState<StoryObjective[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Données statiques des objectifs
    const staticObjectives: StoryObjective[] = [
      {
        id: "1",
        value: "Aider à s'endormir",
      },
      {
        id: "2",
        value: "Se concentrer",
      },
      {
        id: "3",
        value: "Se détendre",
      },
      {
        id: "4",
        value: "S'amuser",
      }
    ];

    setObjectives(staticObjectives);
    setIsLoading(false);
  }, []);

  return {
    objectives,
    isLoading,
  };
};
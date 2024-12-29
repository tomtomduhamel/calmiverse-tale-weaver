import { useState, useEffect } from "react";

export interface StoryObjective {
  id: string;
  value: string;
}

export const useStoryObjectives = () => {
  const [objectives, setObjectives] = useState<StoryObjective[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Static objectives data
    const staticObjectives: StoryObjective[] = [
      {
        id: "sleep",
        value: "Aider à s'endormir",
      },
      {
        id: "focus",
        value: "Se concentrer",
      },
      {
        id: "relax",
        value: "Se détendre",
      },
      {
        id: "fun",
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
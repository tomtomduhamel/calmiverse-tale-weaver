import { useState, useEffect } from "react";

export interface StoryObjective {
  id: string;
  value: string;
  label: string;
}

export const useStoryObjectives = () => {
  const [objectives, setObjectives] = useState<StoryObjective[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Static objectives data
    const staticObjectives: StoryObjective[] = [
      {
        id: "sleep",
        value: "sleep",
        label: "Aider à s'endormir"
      },
      {
        id: "focus",
        value: "focus",
        label: "Se concentrer"
      },
      {
        id: "relax",
        value: "relax",
        label: "Se détendre"
      },
      {
        id: "fun",
        value: "fun",
        label: "S'amuser"
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
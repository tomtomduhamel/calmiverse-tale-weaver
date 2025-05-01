
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Objective } from '@/types/story';

export const useStoryObjectives = () => {
  const [objectives, setObjectives] = useState<Objective[]>([
    { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
    { id: "focus", label: "Se concentrer", value: "focus" },
    { id: "relax", label: "Se détendre", value: "relax" },
    { id: "fun", label: "S'amuser", value: "fun" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Pour l'instant, nous utilisons des objectifs statiques
  // Dans le futur, ils pourront être chargés depuis la base de données
  useEffect(() => {
    setIsLoading(false);
    console.log("Objectifs chargés:", objectives);
  }, []);

  return {
    objectives,
    isLoading,
    error,
  };
};

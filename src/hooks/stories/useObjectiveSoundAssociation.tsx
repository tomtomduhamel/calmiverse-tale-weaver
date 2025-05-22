
/**
 * Hook pour gérer l'association entre les objectifs d'histoire et les fonds sonores
 */
import { useCallback } from "react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSoundSelectionForObjective } from './sound/useSoundSelectionForObjective';
import { useSoundAssociationOperations } from './sound/useSoundAssociationOperations';
import { useSoundObjectiveStats } from './sound/useSoundObjectiveStats';

export const useObjectiveSoundAssociation = () => {
  const { toast } = useToast();
  const { findSoundForObjective } = useSoundSelectionForObjective(toast);
  const { autoAssociateSoundToStory } = useSoundAssociationOperations(findSoundForObjective, toast);
  const { getSoundsByObjective, getSoundObjectiveStats } = useSoundObjectiveStats();
  
  return {
    findSoundForObjective,
    autoAssociateSoundToStory,
    getSoundsByObjective,
    getSoundObjectiveStats
  };
};

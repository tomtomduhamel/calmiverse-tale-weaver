
/**
 * @deprecated Ce hook est devenu trop volumineux et a été divisé en plusieurs hooks spécialisés.
 * Utilisez plutôt les hooks dans src/hooks/stories/
 * Ce hook reste disponible pour la rétrocompatibilité.
 */

import { useSupabaseStories as useSupabaseStoriesImplementation } from './stories/useSupabaseStories';

// Re-export le hook implémenté dans le dossier stories/
export const useSupabaseStories = useSupabaseStoriesImplementation;

export default useSupabaseStories;

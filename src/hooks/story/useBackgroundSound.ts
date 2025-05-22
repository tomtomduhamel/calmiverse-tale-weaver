
/**
 * @deprecated Ce hook est devenu trop volumineux et a été divisé en plusieurs hooks spécialisés.
 * Utilisez plutôt les hooks dans src/hooks/story/sound/
 * Ce hook reste disponible pour la rétrocompatibilité.
 */

import { useBackgroundSound as useBackgroundSoundImplementation } from './sound/useBackgroundSound';

// Re-export le hook implémenté dans le dossier sound/
export const useBackgroundSound = useBackgroundSoundImplementation;

export default useBackgroundSound;

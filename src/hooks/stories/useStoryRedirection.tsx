
/**
 * @deprecated Utilisez useAppNavigation à la place
 * Ce hook sera supprimé dans une prochaine version
 */
import { useAppNavigation } from '@/hooks/navigation/useAppNavigation';

export const useStoryRedirection = () => {
  const { navigateToLibrary, navigateToHome } = useAppNavigation();
  
  console.warn(
    "Le hook useStoryRedirection est déprécié. " +
    "Veuillez utiliser useAppNavigation à la place."
  );

  return {
    redirectToLibrary: navigateToLibrary,
    redirectToHome: navigateToHome
  };
};

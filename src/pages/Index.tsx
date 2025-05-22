
import React from "react";
import { useIndexPage } from "@/hooks/useIndexPage";
import ContentView from "@/components/layout/ContentView";
import LoadingErrorHandler from "@/components/layout/LoadingErrorHandler";
import MobileMenu from "@/components/MobileMenu";

/**
 * Page principale de l'application
 */
const Index = () => {
  const indexPageProps = useIndexPage();
  
  const {
    isLoading,
    stories,
    user,
    isMobile
  } = indexPageProps;

  // Gérer l'état de chargement et d'erreur
  const error = stories.error;
  
  // Si l'utilisateur n'est pas connecté, afficher un état de chargement
  // (useAuthRedirection gère déjà la redirection)
  if (!user) {
    return <LoadingErrorHandler isLoading={true} error={null} children={null} />;
  }

  return (
    <div className="h-full w-full overflow-x-hidden">
      <LoadingErrorHandler isLoading={isLoading} error={error}>
        <div className={`index-container max-w-7xl mx-auto p-2 sm:p-4 ${isMobile ? 'pb-32' : 'mb-20'}`}>
          <ContentView {...indexPageProps} />
        </div>
        
        {/* Menu de navigation pour mobile */}
        <MobileMenu 
          currentView={indexPageProps.currentView} 
          onViewChange={indexPageProps.setCurrentView} 
        />
      </LoadingErrorHandler>
    </div>
  );
};

export default Index;

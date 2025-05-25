
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
    isMobile,
    children
  } = indexPageProps;

  // Debug: Afficher les informations sur les enfants au niveau Index
  console.log('[Index] Enfants disponibles:', {
    childrenCount: children?.length || 0,
    children: children?.map(c => ({ id: c.id, name: c.name })) || [],
    user: user?.id
  });

  // Gérer l'état de chargement et d'erreur
  const error = stories.error;
  
  // Si l'utilisateur n'est pas connecté, afficher un état de chargement
  // (useAuthRedirection gère déjà la redirection)
  if (!user) {
    return <LoadingErrorHandler isLoading={true} error={null} children={null} />;
  }

  // Mappage explicite des props pour ContentView selon l'interface ContentViewProps
  const contentViewProps = {
    currentView: indexPageProps.currentView,
    showGuide: indexPageProps.showGuide,
    stories: stories.stories || [],
    children: children || [], // S'assurer que children est toujours un tableau
    currentStory: indexPageProps.currentStory || null,
    pendingStoryId: indexPageProps.pendingStoryId,
    isRetrying: indexPageProps.isRetrying,
    onViewChange: indexPageProps.setCurrentView,
    onAddChild: indexPageProps.handleAddChild,
    onUpdateChild: indexPageProps.handleUpdateChild,
    onDeleteChild: indexPageProps.handleDeleteChild,
    onSubmitStory: indexPageProps.handleStorySubmitWrapper,
    onCreateChildFromStory: indexPageProps.handleCreateChildFromStory,
    onStoryCreated: indexPageProps.handleStoryCreated,
    onSelectStory: indexPageProps.handleSelectStory,
    onDeleteStory: indexPageProps.handleDeleteStory,
    onRetryStory: indexPageProps.handleRetryStory,
    onCloseReader: indexPageProps.handleCloseReader,
    onMarkAsRead: indexPageProps.handleMarkAsRead,
  };

  return (
    <div className="h-full w-full overflow-x-hidden">
      <LoadingErrorHandler isLoading={isLoading} error={error}>
        <div className={`index-container max-w-7xl mx-auto p-2 sm:p-4 ${isMobile ? 'pb-32' : 'mb-20'}`}>
          <ContentView {...contentViewProps} />
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

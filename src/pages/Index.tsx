
import React from "react";
import { useIndexPage } from "@/hooks/useIndexPage";
import ContentView from "@/components/layout/ContentView";
import LoadingErrorHandler from "@/components/layout/LoadingErrorHandler";
import MobileMenu from "@/components/MobileMenu";

const Index = () => {
  const {
    isLoading,
    stories,
    user,
    isMobile,
    currentView,
    showGuide,
    currentStory,
    children,
    pendingStoryId,
    isRetrying,
    setCurrentView,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild,
    handleStorySubmitWrapper,
    handleCreateChildFromStory,
    handleStoryCreated,
    handleSelectStory,
    handleDeleteStory,
    handleRetryStory,
    handleCloseReader,
    handleMarkAsRead
  } = useIndexPage();

  // Gérer l'état de chargement et d'erreur
  const error = stories.error;
  
  // Si l'utilisateur n'est pas connecté, ne rien afficher 
  // (le hook useIndexPage gère déjà la redirection)
  if (!user) {
    return <LoadingErrorHandler isLoading={true} error={null} children={null} />;
  }

  return (
    <div className="h-full w-full overflow-x-hidden">
      <LoadingErrorHandler isLoading={isLoading} error={error}>
        <div className={`index-container max-w-7xl mx-auto p-2 sm:p-4 ${isMobile ? 'pb-32' : 'mb-20'}`}>
          <ContentView
            currentView={currentView}
            showGuide={showGuide}
            stories={stories.stories || []}
            children={children}
            currentStory={currentStory}
            pendingStoryId={pendingStoryId}
            isRetrying={isRetrying}
            onViewChange={setCurrentView}
            onAddChild={handleAddChild}
            onUpdateChild={handleUpdateChild}
            onDeleteChild={handleDeleteChild}
            onSubmitStory={handleStorySubmitWrapper}
            onCreateChildFromStory={handleCreateChildFromStory}
            onStoryCreated={handleStoryCreated}
            onSelectStory={handleSelectStory}
            onDeleteStory={handleDeleteStory}
            onRetryStory={handleRetryStory}
            onCloseReader={handleCloseReader}
            onMarkAsRead={handleMarkAsRead}
          />
        </div>
        
        {/* Mobile navigation menu */}
        <MobileMenu currentView={currentView} onViewChange={setCurrentView} />
      </LoadingErrorHandler>
    </div>
  );
};

export default Index;

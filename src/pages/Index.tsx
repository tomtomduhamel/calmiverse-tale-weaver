
import React from "react";
import { useIndexPage } from "@/hooks/useIndexPage";
import ContentView from "@/components/layout/ContentView";
import LoadingErrorHandler from "@/components/layout/LoadingErrorHandler";

/**
 * Page principale de l'application
 * Note: Le reader a maintenant sa propre route /reader/:id
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

  // Mappage explicite des props pour ContentView (currentView/onViewChange supprimés)
  const contentViewProps = {
    showGuide: indexPageProps.showGuide,
    stories: stories.stories || [],
    children: children || [], // S'assurer que children est toujours un tableau
    pendingStoryId: indexPageProps.pendingStoryId,
    isRetrying: indexPageProps.isRetrying,
    onAddChild: indexPageProps.handleAddChild,
    onUpdateChild: indexPageProps.handleUpdateChild,
    onDeleteChild: indexPageProps.handleDeleteChild,
    onSubmitStory: indexPageProps.handleStorySubmitWrapper,
    onCreateChildFromStory: indexPageProps.handleCreateChildFromStory,
    onStoryCreated: indexPageProps.handleStoryCreated,
    onSelectStory: indexPageProps.handleSelectStory,
    onDeleteStory: indexPageProps.handleDeleteStory,
    onRetryStory: indexPageProps.handleRetryStory,
    onMarkAsRead: indexPageProps.handleMarkAsRead,
  };

  return (
    <div className="h-full w-full overflow-x-hidden">
      <div className={`index-container max-w-7xl mx-auto p-2 sm:p-4 ${isMobile ? 'pb-32' : 'mb-20'}`}>
        <ContentView {...contentViewProps} />
      </div>
    </div>
  );
};

export default Index;

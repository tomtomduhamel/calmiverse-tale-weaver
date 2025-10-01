
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  HomeView,
  CreateStoryView,
  ProfilesView,
  LibraryView
} from "@/pages/views";
import type { Story } from "@/types/story";
import type { Child } from "@/types/child";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppNavigation } from "@/hooks/navigation/useAppNavigation";

interface ViewHandlers {
  onAddChild: (child: Omit<Child, "id">) => Promise<string>;
  onUpdateChild: (childId: string, updatedChild: Partial<Child>) => Promise<void>;
  onDeleteChild: (childId: string) => Promise<void>;
  onSubmitStory: (formData: any) => Promise<string>;
  onCreateChildFromStory: (child: Omit<Child, "id">) => Promise<string>;
  onStoryCreated: (story: Story) => void;
  onSelectStory: (story: Story) => void;
  onDeleteStory: (storyId: string) => Promise<boolean>;
  onRetryStory: (storyId: string) => Promise<boolean>;
  onMarkAsRead: (storyId: string) => Promise<boolean>;
}

interface ContentRouterProps extends ViewHandlers {
  showGuide: boolean;
  stories: Story[];
  children: Child[];
  pendingStoryId: string | null;
  isRetrying: boolean;
}

/**
 * PHASE 2: ContentRouter refactorisé - utilise location au lieu de currentView
 * La navigation est gérée par React Router uniquement
 */
const ContentRouter: React.FC<ContentRouterProps> = ({
  showGuide,
  stories,
  children,
  pendingStoryId,
  isRetrying,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
  onSubmitStory,
  onCreateChildFromStory,
  onStoryCreated,
  onSelectStory,
  onDeleteStory,
  onRetryStory,
  onMarkAsRead
}) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { navigateToCreate } = useAppNavigation();
  
  // Validation pour débogage
  useEffect(() => {
    console.log("[ContentRouter] Rendu avec pathname =", location.pathname);
    console.log("[ContentRouter] children transmis =", {
      childrenCount: children?.length || 0,
      childrenIds: children?.map(c => c.id) || []
    });
  }, [location.pathname, children]);
  
  // Mapping des routes à des composants (basé sur location.pathname)
  const renderView = () => {
    // Page d'accueil
    if (location.pathname === "/") {
      return (
        <HomeView 
          showGuide={showGuide} 
          children={children}
        />
      );
    }
    
    // Page de création d'histoire
    if (location.pathname.startsWith("/create-story")) {
      return (
        <CreateStoryView
          onSubmit={onSubmitStory}
          children={children}
          onCreateChild={onCreateChildFromStory}
          onStoryCreated={onStoryCreated}
        />
      );
    }
    
    // Page de profils enfants
    if (location.pathname === "/children") {
      return (
        <ProfilesView
          children={children}
          onAddChild={onAddChild}
          onUpdateChild={onUpdateChild}
          onDeleteChild={onDeleteChild}
          onCreateStory={(childId) => {
            navigateToCreate();
          }}
        />
      );
    }
    
    // Page bibliothèque
    if (location.pathname === "/library") {
      return (
        <LibraryView
          stories={stories}
          onSelectStory={onSelectStory}
          onDeleteStory={onDeleteStory}
          onRetryStory={onRetryStory}
          isRetrying={isRetrying}
          pendingStoryId={pendingStoryId}
        />
      );
    }
    
    // Default: Home
    return (
      <HomeView 
        showGuide={showGuide} 
        children={children}
      />
    );
  };
  
  console.log("[ContentRouter] Affichage de la route:", location.pathname);
  return (
    <div className={isMobile ? "pb-16" : ""}>
      {renderView()}
    </div>
  );
};

export default ContentRouter;

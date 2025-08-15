
import React, { useEffect } from 'react';
import {
  HomeView,
  CreateStoryView,
  ProfilesView,
  LibraryView
} from "@/pages/views";
import type { ViewType } from "@/types/views";
import type { Story } from "@/types/story";
import type { Child } from "@/types/child";
import { useIsMobile } from "@/hooks/use-mobile";

interface ViewHandlers {
  onViewChange: (view: ViewType) => void;
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
  currentView: ViewType;
  showGuide: boolean;
  stories: Story[];
  children: Child[];
  pendingStoryId: string | null;
  isRetrying: boolean;
}

/**
 * Composant de routage déclaratif pour les différentes vues de l'application
 * Note: Le reader n'est plus géré ici, il a sa propre route /reader/:id
 */
const ContentRouter: React.FC<ContentRouterProps> = ({
  currentView,
  showGuide,
  stories,
  children,
  pendingStoryId,
  isRetrying,
  onViewChange,
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
  
  // Validation pour débogage
  useEffect(() => {
    console.log("[ContentRouter] DEBUG: Rendu avec currentView =", currentView);
    console.log("[ContentRouter] DEBUG: children transmis =", {
      children: children,
      childrenCount: children?.length || 0,
      childrenIds: children?.map(c => c.id) || []
    });
  }, [currentView, children]);
  
  // Mapping des vues à des composants (reader supprimé)
  const viewComponents = {
    home: (
      <HomeView 
        onViewChange={onViewChange} 
        showGuide={showGuide} 
        children={children}
      />
    ),
    
    create: (
      <CreateStoryView
        onSubmit={onSubmitStory}
        children={children}
        onCreateChild={onCreateChildFromStory}
        onStoryCreated={onStoryCreated}
      />
    ),
    
    profiles: (
      <ProfilesView
        children={children}
        onAddChild={onAddChild}
        onUpdateChild={onUpdateChild}
        onDeleteChild={onDeleteChild}
        onCreateStory={(childId) => {
          if (childId) {
            // Navigate to create story with pre-selected child
            window.location.href = `/create-story/step-1?childId=${childId}`;
          } else {
            onViewChange("create");
          }
        }}
      />
    ),
    
    library: (
      <LibraryView
        stories={stories}
        onSelectStory={onSelectStory}
        onDeleteStory={onDeleteStory}
        onRetryStory={onRetryStory}
        onViewChange={onViewChange}
        isRetrying={isRetrying}
        pendingStoryId={pendingStoryId}
      />
    )
  };
  
  // Affichage des vues (reader n'est plus inclus)
  console.log("[ContentRouter] DEBUG: Affichage de la vue:", currentView);
  return (
    <div className={isMobile ? "pb-16" : ""}>
      {viewComponents[currentView as keyof typeof viewComponents]}
    </div>
  );
};

export default ContentRouter;

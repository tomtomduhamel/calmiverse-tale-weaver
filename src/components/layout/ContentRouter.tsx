
import React, { useEffect } from 'react';
import {
  HomeView,
  CreateStoryView,
  ProfilesView,
  LibraryView,
  ReaderView
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
  onCloseReader: () => void;
  onMarkAsRead: (storyId: string) => Promise<boolean>;
}

interface ContentRouterProps extends ViewHandlers {
  currentView: ViewType;
  showGuide: boolean;
  stories: Story[];
  children: Child[];
  currentStory: Story | null;
  pendingStoryId: string | null;
  isRetrying: boolean;
}

/**
 * Composant de routage déclaratif pour les différentes vues de l'application
 */
const ContentRouter: React.FC<ContentRouterProps> = ({
  currentView,
  showGuide,
  stories,
  children,
  currentStory,
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
  onCloseReader,
  onMarkAsRead
}) => {
  const isMobile = useIsMobile();
  
  // Validation pour débogage
  useEffect(() => {
    console.log("[ContentRouter] DEBUG: Rendu avec currentView =", currentView);
    console.log("[ContentRouter] DEBUG: currentStory =", currentStory?.id);
    
    if (currentView === "reader" && !currentStory) {
      console.error("[ContentRouter] ERROR: Vue reader demandée mais currentStory est null!");
    }
  }, [currentView, currentStory]);
  
  // Mapping des vues à des composants
  const viewComponents = {
    home: (
      <HomeView 
        onViewChange={onViewChange} 
        showGuide={showGuide} 
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
        onCreateStory={() => onViewChange("create")}
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
  
  // Condition pour afficher le lecteur d'histoire 
  const shouldShowReader = currentView === "reader" && currentStory !== null;
  
  // Rendu prioritaire du lecteur en mode plein écran
  if (shouldShowReader && currentStory) {
    return (
      <ReaderView
        story={currentStory}
        onClose={onCloseReader}
        onMarkAsRead={onMarkAsRead}
      />
    );
  }
  
  // Affichage normal si le lecteur n'est pas actif
  return (
    <div className={isMobile ? "pb-16" : ""}>
      {/* Afficher la vue sélectionnée */}
      {viewComponents[currentView as keyof typeof viewComponents]}
    </div>
  );
};

export default ContentRouter;

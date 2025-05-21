
import React, { useEffect } from "react";
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

interface ContentViewProps {
  currentView: ViewType;
  showGuide: boolean;
  stories: any[];
  children: Child[];
  currentStory: Story | null;
  pendingStoryId: string | null;
  isRetrying: boolean;
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

const ContentView: React.FC<ContentViewProps> = ({
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
  
  // Log pour le débogage du rendu conditionnel
  useEffect(() => {
    console.log("[ContentView] DEBUG: Rendu avec currentView =", currentView);
    console.log("[ContentView] DEBUG: currentStory =", currentStory?.id);
    console.log("[ContentView] DEBUG: Condition pour afficher ReaderView:", currentView === "reader" && currentStory !== null);
  }, [currentView, currentStory]);
  
  return (
    <>
      {currentView === "home" && (
        <HomeView 
          onViewChange={onViewChange} 
          showGuide={showGuide} 
        />
      )}

      {currentView === "create" && (
        <CreateStoryView
          onSubmit={onSubmitStory}
          children={children}
          onCreateChild={onCreateChildFromStory}
          onStoryCreated={onStoryCreated}
        />
      )}

      {currentView === "profiles" && (
        <ProfilesView
          children={children}
          onAddChild={onAddChild}
          onUpdateChild={onUpdateChild}
          onDeleteChild={onDeleteChild}
          onCreateStory={() => onViewChange("create")}
        />
      )}

      {currentView === "library" && (
        <LibraryView
          stories={stories}
          onSelectStory={onSelectStory}
          onDeleteStory={onDeleteStory}
          onRetryStory={onRetryStory}
          onViewChange={onViewChange}
          isRetrying={isRetrying}
          pendingStoryId={pendingStoryId}
        />
      )}

      {/* Le composant ReaderView avec condition simplifiée */}
      {currentView === "reader" && currentStory && (
        <ReaderView
          story={currentStory}
          onClose={onCloseReader}
          onMarkAsRead={onMarkAsRead}
        />
      )}
    </>
  );
};

export default ContentView;

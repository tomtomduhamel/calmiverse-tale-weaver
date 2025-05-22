
import React from "react";
import ContentRouter from "./ContentRouter";
import type { ViewType } from "@/types/views";
import type { Story } from "@/types/story";
import type { Child } from "@/types/child";

interface ContentViewProps {
  currentView: ViewType;
  showGuide: boolean;
  stories: Story[];
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

/**
 * Composant conteneur principal pour le contenu de l'application
 */
const ContentView: React.FC<ContentViewProps> = (props) => {
  return <ContentRouter {...props} />;
};

export default ContentView;

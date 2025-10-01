
import React from "react";
import ContentRouter from "./ContentRouter";
import type { ViewType } from "@/types/views";
import type { Story } from "@/types/story";
import type { Child } from "@/types/child";

interface ContentViewProps {
  showGuide: boolean;
  stories: Story[];
  children: Child[];
  pendingStoryId: string | null;
  isRetrying: boolean;
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

/**
 * PHASE 2: ContentView simplifié - plus de currentView
 * Le routage est géré par React Router dans ContentRouter
 */
const ContentView: React.FC<ContentViewProps> = (props) => {
  return <ContentRouter {...props} />;
};

export default ContentView;

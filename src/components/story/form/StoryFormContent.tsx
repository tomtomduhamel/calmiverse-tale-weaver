
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { default as StoryObjectives } from "../StoryObjectives";
import { StoryError } from "./StoryError";
import { StoryProgress } from "./StoryProgress";
import ChildrenSelection from "../ChildrenSelection";
import GenerateStoryButton from "./GenerateStoryButton";
import StoryFormHeader from "./StoryFormHeader";
import type { Child } from "@/types/child";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface StoryFormContentProps {
  children: Child[];
  selectedChildrenIds: string[];
  onChildToggle: (childId: string) => void;
  onCreateChildClick: () => void;
  objective: string;
  setObjective: (objective: string) => void;
  objectives: any[];
  isSubmitting: boolean;
  progress: number;
  formError: string | null;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onModeSwitch: () => void;
  isGenerateButtonDisabled?: boolean;
}

export const StoryFormContent = ({
  children,
  selectedChildrenIds,
  onChildToggle,
  onCreateChildClick,
  objective,
  setObjective,
  objectives,
  isSubmitting,
  progress,
  formError,
  onSubmit,
  onModeSwitch,
  isGenerateButtonDisabled = false,
}: StoryFormContentProps) => {
  const isMobile = useIsMobile();
  
  // Réduire la hauteur du ScrollArea pour s'assurer que le bouton est visible
  const scrollAreaHeight = isMobile ? "h-[calc(100vh-220px)]" : "h-[calc(100vh-150px)]";
  
  const hasChildrenError = formError && formError.toLowerCase().includes("child");
  const hasObjectiveError = formError && formError.toLowerCase().includes("objective");
  
  return (
    <div className="flex flex-col h-full w-full">
      <ScrollArea className={scrollAreaHeight}>
        <form 
          onSubmit={onSubmit} 
          className="space-y-6 animate-fade-in bg-white dark:bg-muted-dark p-4 sm:p-8 rounded-xl shadow-soft-lg transition-all hover:shadow-xl mx-auto max-w-[95%] sm:max-w-4xl mb-20"
        >
          <StoryFormHeader onModeSwitch={onModeSwitch} />
          
          {formError && (
            <StoryError error={formError} className="animate-pulse" />
          )}
          
          <div className={`space-y-4 ${hasChildrenError ? 'ring-2 ring-destructive/20 rounded-lg p-4' : ''}`}>
            <ChildrenSelection
              children={children}
              selectedChildrenIds={selectedChildrenIds}
              onChildToggle={onChildToggle}
              onCreateChildClick={onCreateChildClick}
              hasError={hasChildrenError}
            />
          </div>

          <div className={`space-y-4 ${hasObjectiveError ? 'ring-2 ring-destructive/20 rounded-lg p-4' : ''}`}>
            <label className="text-secondary dark:text-white text-base sm:text-lg font-medium">
              I want to create a reading moment that will...
            </label>
            <StoryObjectives
              objectives={objectives}
              selectedObjective={objective}
              onObjectiveSelect={setObjective}
              hasError={hasObjectiveError}
            />
          </div>

          <StoryProgress isSubmitting={isSubmitting} progress={progress} />
        </form>
      </ScrollArea>
      
      {/* Bouton de génération fixé en bas */}
      <div className="fixed bottom-20 sm:bottom-10 left-0 right-0 px-4 sm:px-8 z-10">
        <div className="max-w-[95%] sm:max-w-4xl mx-auto">
          <GenerateStoryButton disabled={isSubmitting || isGenerateButtonDisabled} />
        </div>
      </div>
    </div>
  );
};


import { ScrollArea } from "@/components/ui/scroll-area";
import { default as StoryObjectives } from "../StoryObjectives";
import { StoryError } from "./StoryError";
import { StoryProgress } from "./StoryProgress";
import ChildrenSelection from "../ChildrenSelection";
import GenerateStoryButton from "./GenerateStoryButton";
import StoryFormHeader from "./StoryFormHeader";
import type { Child } from "@/types/child";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const scrollAreaHeight = isMobile ? "h-[calc(100vh-120px)]" : "h-[calc(100vh-150px)]";
  
  const hasChildrenError = formError && formError.includes("enfant");
  const hasObjectiveError = formError && formError.includes("objectif");
  
  return (
    <ScrollArea className={scrollAreaHeight}>
      <form 
        onSubmit={onSubmit} 
        className="space-y-6 animate-fade-in bg-white dark:bg-muted-dark p-4 sm:p-8 rounded-xl shadow-soft-lg transition-all hover:shadow-xl mx-auto max-w-[95%] sm:max-w-4xl"
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
        <GenerateStoryButton disabled={isSubmitting || isGenerateButtonDisabled} />
      </form>
    </ScrollArea>
  );
};

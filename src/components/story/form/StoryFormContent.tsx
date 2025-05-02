
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
}: StoryFormContentProps) => {
  const isMobile = useIsMobile();
  const scrollAreaHeight = isMobile ? "h-[calc(100vh-120px)]" : "h-[calc(100vh-150px)]";
  
  return (
    <ScrollArea className={scrollAreaHeight}>
      <form 
        onSubmit={onSubmit} 
        className="space-y-6 animate-fade-in bg-white dark:bg-muted-dark p-4 sm:p-8 rounded-xl shadow-soft-lg transition-all hover:shadow-xl mx-auto max-w-[95%] sm:max-w-4xl"
      >
        <StoryFormHeader onModeSwitch={onModeSwitch} />
        <StoryError error={formError} />
        
        <ChildrenSelection
          children={children}
          selectedChildrenIds={selectedChildrenIds}
          onChildToggle={onChildToggle}
          onCreateChildClick={onCreateChildClick}
        />

        <div className="space-y-4">
          <label className="text-secondary dark:text-white text-base sm:text-lg font-medium">
            Je souhaite créer un moment de lecture qui va...
          </label>
          <StoryObjectives
            objectives={objectives}
            selectedObjective={objective}
            onObjectiveSelect={setObjective}
          />
        </div>

        <StoryProgress isSubmitting={isSubmitting} progress={progress} />
        <GenerateStoryButton disabled={isSubmitting} />
      </form>
    </ScrollArea>
  );
};

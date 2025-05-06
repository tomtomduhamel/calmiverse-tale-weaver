
import { Progress } from "@/components/ui/progress";

interface StoryProgressProps {
  progress: number;
  isSubmitting?: boolean;  // Making isSubmitting optional to maintain backward compatibility
}

export const StoryProgress = ({ progress, isSubmitting = true }: StoryProgressProps) => {
  if (!isSubmitting) return null;
  
  // Display different messages based on progress
  const getMessage = () => {
    if (progress < 20) return "Starting story generation...";
    if (progress < 50) return "Creating characters and story elements...";
    if (progress < 80) return "Writing your personalized story...";
    return "Finalizing your story...";
  };
  
  return (
    <div className="space-y-2 animate-fade-in">
      <div className="text-sm text-muted-foreground">{getMessage()}</div>
      <Progress value={progress} className="h-2" />
      {progress > 0 && (
        <div className="text-xs text-right text-muted-foreground">
          {Math.min(Math.round(progress), 99)}%
        </div>
      )}
    </div>
  );
};

// Export the type for use in other components
export type { StoryProgressProps };

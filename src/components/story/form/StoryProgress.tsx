
import { Progress } from "@/components/ui/progress";

interface StoryProgressProps {
  isSubmitting: boolean;
  progress: number;
}

export const StoryProgress = ({ isSubmitting, progress }: StoryProgressProps) => {
  if (!isSubmitting) return null;
  
  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground">Préparation de votre histoire...</div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

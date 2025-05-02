
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface StoryErrorProps {
  error: string | null;
  className?: string;
}

export const StoryError = ({ error, className }: StoryErrorProps) => {
  if (!error) return null;

  return (
    <div className={cn(
      "p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-2",
      className
    )}>
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <div className="text-sm font-medium">{error}</div>
    </div>
  );
};

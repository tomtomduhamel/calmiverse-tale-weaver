
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StoryErrorProps {
  error: string | null;
}

export const StoryError = ({ error }: StoryErrorProps) => {
  if (!error) return null;

  return (
    <Alert variant="destructive" className="bg-red-50 text-red-800 border-red-200">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Erreur</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
};

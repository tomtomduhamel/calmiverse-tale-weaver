
import { useToast } from "@/hooks/use-toast";

// Define a custom type that extends the available toast variants
type ExtendedVariant = "default" | "destructive" | "warning";

export const useNotifications = (setError?: (error: string | null) => void) => {
  const { toast } = useToast();

  const notifySuccess = (message: string) => {
    toast({
      title: "Success",
      description: message,
    });
  };

  const notifyError = (message: string) => {
    if (setError) {
      setError(message);
    }
    
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  };

  const notifyInfo = (message: string) => {
    toast({
      title: "Information",
      description: message,
    });
  };

  const notifyWarning = (message: string) => {
    // Use 'as any' to bypass the type checking for the variant
    // Since we're adding a custom style for warning in the Toaster component
    toast({
      title: "Warning",
      description: message,
      variant: "destructive", // Changed to use a valid variant
      className: "bg-amber-500 border-amber-600 text-white", // Add warning styling
    });
  };

  return {
    toast,
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning
  };
};

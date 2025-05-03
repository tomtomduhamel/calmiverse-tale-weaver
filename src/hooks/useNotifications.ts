
import { useToast } from "@/hooks/use-toast";

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
    toast({
      title: "Warning",
      description: message,
      variant: "warning",
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

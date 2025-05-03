
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

  return {
    toast,
    notifySuccess,
    notifyError
  };
};

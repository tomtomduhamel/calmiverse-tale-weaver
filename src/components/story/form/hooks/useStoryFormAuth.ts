
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export const useStoryFormAuth = (setFormError: (error: string | null) => void) => {
  const [authChecked, setAuthChecked] = useState(false);
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Check authentication status when component loads
  useEffect(() => {
    if (!authLoading) {
      setAuthChecked(true);
      
      if (!user) {
        console.log("User not authenticated, displaying error");
        setFormError("User not authenticated");
        toast({
          title: "Error",
          description: "You must be logged in to create a story",
          variant: "destructive",
        });
      } else {
        console.log("User authenticated:", user.id);
        setFormError(null);
      }
    }
  }, [user, authLoading, toast, setFormError]);

  return {
    user,
    authLoading,
    authChecked,
    isAuthenticated: !!user
  };
};

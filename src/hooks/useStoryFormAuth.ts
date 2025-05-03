
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useNavigate } from "react-router-dom";

export const useStoryFormAuth = (setFormError: (error: string | null) => void) => {
  const [authChecked, setAuthChecked] = useState(false);
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if user is authenticated and redirect to auth page if necessary
  useEffect(() => {
    console.log("Checking authentication in useStoryFormAuth", { 
      user: user?.id, 
      authLoading,
      authChecked
    });
    
    if (!authLoading) {
      setAuthChecked(true);
      
      if (!user) {
        console.log("User not authenticated, displaying error");
        setFormError("User not authenticated");
        toast({
          title: "Authentication Required",
          description: "You must be logged in to create a story",
          variant: "destructive",
        });
      } else {
        console.log("User authenticated:", user.id);
        setFormError(null);
      }
    }
  }, [user, authLoading, toast, setFormError, authChecked]);

  return {
    user,
    authLoading,
    authChecked,
    isAuthenticated: !!user
  };
};

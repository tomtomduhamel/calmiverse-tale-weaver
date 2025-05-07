
import { useState, useCallback } from "react";
import type { Child } from "@/types/child";

/**
 * Hook encapsulating child creation form logic
 */
export const useChildFormLogic = (onCreateChild: (child: Omit<Child, "id">) => Promise<string> | void) => {
  // Show/hide form
  const [showChildForm, setShowChildForm] = useState<boolean>(false);
  
  // Form values
  const [childName, setChildName] = useState<string>("");
  const [childAge, setChildAge] = useState<string>("1"); // Use string type to match form inputs
  
  // Form submission handler
  const handleChildFormSubmit = useCallback(async (childName: string, childAge: string) => {
    try {
      console.log("[useChildFormLogic] Creating child with name:", childName, "age:", childAge);
      
      // Calculate birth date from age
      const now = new Date();
      // Convert string to number for calculation
      const birthYear = now.getFullYear() - parseInt(childAge);
      const birthDate = new Date(birthYear, now.getMonth(), now.getDate());
      
      // Create child
      await onCreateChild({
        name: childName,
        birthDate,
        interests: [],
        gender: 'unknown',
        authorId: '' // Will be filled by backend
      });
      
      // Close form
      setShowChildForm(false);
      
      // Reset form
      setChildName("");
      setChildAge("1");
      
    } catch (error) {
      console.error("[useChildFormLogic] Error creating child:", error);
      // Error handled by caller
    }
  }, [onCreateChild]);
  
  // Reset form fields
  const resetChildForm = useCallback(() => {
    setChildName("");
    setChildAge("1");
  }, []);
  
  return {
    showChildForm,
    setShowChildForm,
    childName,
    setChildName,
    childAge,
    setChildAge,
    handleChildFormSubmit,
    resetChildForm
  };
};

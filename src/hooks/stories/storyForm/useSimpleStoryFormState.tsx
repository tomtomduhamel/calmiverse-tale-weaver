
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook for managing the state of the simplified story form
 */
export const useSimpleStoryFormState = () => {
  // Form fields
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChildForm, setShowChildForm] = useState(false);
  
  // Auth information
  const { user, session, loading: authLoading } = useSupabaseAuth();
  
  // Debug logging
  useEffect(() => {
    console.log('[useSimpleStoryFormState] State updated:', {
      selectedChildrenIds,
      selectedChildCount: selectedChildrenIds.length,
      selectedObjective,
      formError,
      isSubmitting,
      userLoggedIn: !!user,
      sessionValid: !!session
    });
  }, [selectedChildrenIds, selectedObjective, formError, isSubmitting, user, session]);

  // Clear errors when fields change
  useEffect(() => {
    if (formError) {
      if ((formError.toLowerCase().includes('enfant') && selectedChildrenIds.length > 0) ||
          (formError.toLowerCase().includes('objectif') && selectedObjective)) {
        setFormError(null);
      }
    }
  }, [selectedChildrenIds, selectedObjective, formError]);

  return {
    // Form state
    selectedChildrenIds,
    setSelectedChildrenIds,
    selectedObjective,
    setSelectedObjective,
    formError,
    setFormError,
    isSubmitting,
    setIsSubmitting,
    
    // Child form controls
    showChildForm,
    setShowChildForm,
    
    // Auth state
    user,
    session,
    authLoading
  };
};

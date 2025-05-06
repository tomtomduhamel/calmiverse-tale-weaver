
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Child } from '@/types/child';
import type { Story } from '@/types/story';

/**
 * Hook principal simplifié pour la création d'histoires
 * Centralise toute la logique dans un seul endroit pour éviter les problèmes de synchronisation
 */
export const useSimplifiedStoryForm = (
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>,
  children: Child[],
  onStoryCreated: (story: Story) => void
) => {
  // État du formulaire centralisé
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showChildForm, setShowChildForm] = useState(false);
  
  // Informations d'authentification
  const { user, session, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Debug logs pour le suivi d'état
  useEffect(() => {
    console.log('[useSimplifiedStoryForm] État actuel:', {
      selectedChildrenIds,
      selectedChildCount: selectedChildrenIds.length,
      selectedObjective,
      formError,
      isSubmitting,
      userLoggedIn: !!user,
      sessionValid: !!session
    });
  }, [selectedChildrenIds, selectedObjective, formError, isSubmitting, user, session]);

  // Effacer l'erreur quand un changement pertinent est fait
  useEffect(() => {
    if (formError) {
      if ((formError.toLowerCase().includes('enfant') && selectedChildrenIds.length > 0) ||
          (formError.toLowerCase().includes('objectif') && selectedObjective)) {
        setFormError(null);
      }
    }
  }, [selectedChildrenIds, selectedObjective, formError]);

  /**
   * Fonction de validation simplifiée
   */
  const validateForm = useCallback(() => {
    console.log('[useSimplifiedStoryForm] Validation du formulaire:', {
      childrenIds: selectedChildrenIds,
      objective: selectedObjective,
      user: !!user,
      session: !!session
    });
    
    if (!user || !session) {
      return { isValid: false, error: 'Vous devez être connecté pour créer une histoire' };
    }
    
    if (!selectedChildrenIds || selectedChildrenIds.length === 0) {
      return { isValid: false, error: 'Veuillez sélectionner au moins un enfant pour créer une histoire' };
    }
    
    if (!selectedObjective) {
      return { isValid: false, error: 'Veuillez sélectionner un objectif pour l\'histoire' };
    }
    
    return { isValid: true, error: null };
  }, [selectedChildrenIds, selectedObjective, user, session]);

  /**
   * Gestionnaire de sélection d'enfant robuste
   */
  const handleChildSelect = useCallback((childId: string) => {
    if (!childId) return;
    
    console.log('[useSimplifiedStoryForm] Toggle enfant:', childId, 'Sélection actuelle:', selectedChildrenIds);
    
    setSelectedChildrenIds(prev => {
      const isSelected = prev.includes(childId);
      return isSelected 
        ? prev.filter(id => id !== childId) 
        : [...prev, childId];
    });
  }, []);

  /**
   * Gestionnaire de sélection d'objectif
   */
  const handleObjectiveSelect = useCallback((objective: string) => {
    console.log('[useSimplifiedStoryForm] Sélection objectif:', objective);
    setSelectedObjective(objective);
  }, []);

  /**
   * Soumission du formulaire centralisée
   */
  const handleFormSubmit = useCallback(async (event: React.FormEvent) => {
    // Toujours prévenir le comportement par défaut du formulaire
    event.preventDefault();
    
    console.log('[useSimplifiedStoryForm] Soumission du formulaire');
    
    if (isSubmitting) {
      console.log('[useSimplifiedStoryForm] Soumission déjà en cours, annulation');
      return;
    }

    try {
      // Validation
      const validation = validateForm();
      if (!validation.isValid) {
        console.error('[useSimplifiedStoryForm] Erreur de validation:', validation.error);
        setFormError(validation.error);
        return;
      }

      // Début de soumission
      setIsSubmitting(true);
      setFormError(null);
      
      // Notification de début
      toast({
        title: "Création en cours",
        description: "Nous préparons votre histoire, veuillez patienter...",
      });

      // Appel à l'API
      const storyId = await onSubmit({
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      });
      
      console.log('[useSimplifiedStoryForm] Histoire créée avec succès, ID:', storyId);
      
      // Notification de succès intermédiaire
      toast({
        title: "Histoire en préparation",
        description: "Votre histoire est en cours de génération, vous serez redirigé(e) lorsqu'elle sera prête.",
      });
      
      // Callback de succès
      if (onStoryCreated) {
        onStoryCreated({
          id: storyId,
          // Valeurs temporaires en attendant la génération complète
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: selectedChildrenIds,
          createdAt: new Date(),
          status: 'pending',
          story_text: "",
          story_summary: "",
          objective: selectedObjective
        } as Story);
      }
      
      // Réinitialisation du formulaire
      setSelectedChildrenIds([]);
      setSelectedObjective('');
      
    } catch (error: any) {
      console.error('[useSimplifiedStoryForm] Erreur lors de la création:', error);
      setFormError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
      
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue pendant la création de l'histoire",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, validateForm, selectedChildrenIds, selectedObjective, onSubmit, onStoryCreated, toast]);

  // Valeur mémorisée pour déterminer si le bouton doit être désactivé
  const isGenerateButtonDisabled = useMemo(() => {
    const disabled = isSubmitting || selectedChildrenIds.length === 0 || !selectedObjective;
    console.log('[useSimplifiedStoryForm] État du bouton:', { disabled, isSubmitting, selectedChildrenIds, selectedObjective });
    return disabled;
  }, [isSubmitting, selectedChildrenIds, selectedObjective]);

  // Interface pour les composants de formulaire d'enfant
  const childFormControls = {
    showChildForm,
    setShowChildForm
  };

  return {
    selectedChildrenIds,
    selectedObjective, 
    formError,
    isSubmitting,
    authLoading,
    isGenerateButtonDisabled,
    
    // Gestionnaires
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit,
    
    // Contrôles pour le formulaire d'enfant
    childFormControls
  };
};

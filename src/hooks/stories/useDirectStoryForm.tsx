
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Child } from '@/types/child';
import type { Story } from '@/types/story';

/**
 * Hook simplifié et direct pour la création d'histoires
 * Élimine la complexité excessive et fournit un flux de données clair
 */
export const useDirectStoryForm = (
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>,
  children: Child[],
  onStoryCreated: (story: Story) => void
) => {
  // État du formulaire centralisé avec des valeurs par défaut explicites
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
    console.log('[useDirectStoryForm] État actuel:', {
      selectedChildrenIds,
      selectedChildCount: selectedChildrenIds.length,
      selectedObjective,
      formError,
      isSubmitting,
      userLoggedIn: !!user,
      sessionValid: !!session
    });
  }, [selectedChildrenIds, selectedObjective, formError, isSubmitting, user, session]);

  // Effacer l'erreur automatiquement quand un changement pertinent est fait
  useEffect(() => {
    if (formError) {
      const errorIncludes = (text: string) => formError.toLowerCase().includes(text.toLowerCase());
      
      if ((errorIncludes('enfant') && selectedChildrenIds.length > 0) ||
          (errorIncludes('objectif') && selectedObjective)) {
        console.log('[useDirectStoryForm] Effacement automatique de l\'erreur après correction');
        setFormError(null);
      }
    }
  }, [selectedChildrenIds, selectedObjective, formError]);

  /**
   * Validation du formulaire avec gestion des erreurs améliorée
   */
  const validateForm = useCallback(() => {
    console.log('[useDirectStoryForm] Validation du formulaire avec:', {
      childrenIds: selectedChildrenIds,
      objective: selectedObjective,
      user: !!user,
      session: !!session,
      childrenCount: selectedChildrenIds.length
    });
    
    // Vérification de l'authentification
    if (!user || !session) {
      return { isValid: false, error: 'Vous devez être connecté pour créer une histoire' };
    }
    
    // Vérification de la sélection d'enfant
    if (!selectedChildrenIds || selectedChildrenIds.length === 0) {
      return { isValid: false, error: 'Veuillez sélectionner au moins un enfant pour créer une histoire' };
    }
    
    // Vérification de l'objectif
    if (!selectedObjective) {
      return { isValid: false, error: 'Veuillez sélectionner un objectif pour l\'histoire' };
    }
    
    return { isValid: true, error: null };
  }, [selectedChildrenIds, selectedObjective, user, session]);

  /**
   * Gestionnaire de sélection d'enfant simplifié et robuste
   */
  const handleChildSelect = useCallback((childId: string) => {
    if (!childId) {
      console.warn('[useDirectStoryForm] handleChildSelect appelé sans childId valide');
      return;
    }
    
    console.log('[useDirectStoryForm] Sélection enfant:', childId, 'Sélection actuelle:', selectedChildrenIds);
    
    setSelectedChildrenIds(prev => {
      const isSelected = prev.includes(childId);
      return isSelected 
        ? prev.filter(id => id !== childId) 
        : [...prev, childId];
    });
  }, [selectedChildrenIds]);

  /**
   * Gestionnaire de sélection d'objectif
   */
  const handleObjectiveSelect = useCallback((objective: string) => {
    console.log('[useDirectStoryForm] Sélection objectif:', objective);
    setSelectedObjective(objective);
  }, []);

  /**
   * Soumission du formulaire avec gestion d'erreurs simplifiée
   */
  const handleFormSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    console.log('[useDirectStoryForm] Soumission du formulaire');
    
    if (isSubmitting) {
      console.log('[useDirectStoryForm] Soumission déjà en cours, annulation');
      return;
    }

    try {
      // Validation renforcée
      const validation = validateForm();
      if (!validation.isValid) {
        console.error('[useDirectStoryForm] Erreur de validation:', validation.error);
        setFormError(validation.error || 'Erreur de validation du formulaire');
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

      // Appel à l'API avec des données explicites
      const formData = {
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      };
      
      console.log('[useDirectStoryForm] Envoi des données:', formData);
      const storyId = await onSubmit(formData);
      
      console.log('[useDirectStoryForm] Histoire créée avec succès, ID:', storyId);
      
      // Notification de succès intermédiaire
      toast({
        title: "Histoire en préparation",
        description: "Votre histoire est en cours de génération, vous serez redirigé(e) lorsqu'elle sera prête.",
      });
      
      // Callback de succès avec données minimales mais suffisantes
      if (onStoryCreated && storyId) {
        onStoryCreated({
          id: storyId,
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
      
      // Réinitialisation du formulaire pour éviter les soumissions multiples
      setSelectedChildrenIds([]);
      setSelectedObjective('');
      
    } catch (error: any) {
      console.error('[useDirectStoryForm] Erreur lors de la création:', error);
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
  const isGenerateButtonDisabled = selectedChildrenIds.length === 0 || !selectedObjective || isSubmitting;

  return {
    selectedChildrenIds,
    selectedObjective, 
    formError,
    isSubmitting,
    showChildForm,
    setShowChildForm,
    authLoading,
    isGenerateButtonDisabled,
    
    // Gestionnaires
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit
  };
};

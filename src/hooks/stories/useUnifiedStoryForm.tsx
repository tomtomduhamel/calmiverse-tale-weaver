
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";

/**
 * Hook unifié pour la gestion du formulaire d'histoire
 * Remplace la chaîne complexe de hooks imbriqués par une solution unique et cohérente
 */
export const useUnifiedStoryForm = (
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>,
  children: Child[] = [],
  onStoryCreated: (story: Story) => void
) => {
  // État du formulaire - regroupé en un seul endroit
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // État du formulaire d'enfant
  const [showChildForm, setShowChildForm] = useState<boolean>(false);
  
  // Authentication
  const { user, session, loading: authLoading } = useSupabaseAuth();
  
  // Notifications
  const { toast } = useToast();
  
  // Logs de débogage pour suivre l'état
  useEffect(() => {
    console.log("[useUnifiedStoryForm] État actuel:", { 
      selectedChildrenIds, 
      selectedObjective,
      isSubmitting,
      formError,
      userLoggedIn: !!user,
      childCount: children?.length || 0
    });
  }, [selectedChildrenIds, selectedObjective, isSubmitting, formError, user, children]);
  
  // Effacer les erreurs quand la sélection change
  useEffect(() => {
    if (formError) {
      if ((formError.toLowerCase().includes('enfant') && selectedChildrenIds.length > 0) ||
          (formError.toLowerCase().includes('objectif') && selectedObjective)) {
        console.log("[useUnifiedStoryForm] Effacement de l'erreur car les données ont été corrigées");
        setFormError(null);
      }
    }
  }, [selectedChildrenIds, selectedObjective, formError]);

  /**
   * Fonction de validation du formulaire - consolidée en un seul endroit
   */
  const validateForm = useCallback(() => {
    console.log("[useUnifiedStoryForm] Validation du formulaire:", {
      childrenIds: selectedChildrenIds, 
      objective: selectedObjective,
      hasUser: !!user,
      hasSession: !!session
    });
    
    // Vérification de l'authentification
    if (!user || !session) {
      return { isValid: false, error: "Vous devez être connecté pour créer une histoire" };
    }
    
    // Vérification de la sélection d'enfant
    if (!selectedChildrenIds || selectedChildrenIds.length === 0) {
      return { isValid: false, error: "Veuillez sélectionner au moins un enfant pour créer une histoire" };
    }
    
    // Vérification de l'objectif
    if (!selectedObjective) {
      return { isValid: false, error: "Veuillez sélectionner un objectif pour l'histoire" };
    }
    
    return { isValid: true, error: null };
  }, [selectedChildrenIds, selectedObjective, user, session]);

  /**
   * Gestionnaire de sélection d'enfant - utilise une fonction pour éviter les problèmes de référence
   */
  const handleChildSelect = useCallback((childId: string) => {
    if (!childId) return;
    
    console.log("[useUnifiedStoryForm] Sélection/désélection enfant:", childId);
    
    setSelectedChildrenIds(prev => {
      const isSelected = prev.includes(childId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== childId) 
        : [...prev, childId];
        
      console.log("[useUnifiedStoryForm] Nouvelle sélection:", newSelection);
      return newSelection;
    });
  }, []);

  /**
   * Gestionnaire de sélection d'objectif
   */
  const handleObjectiveSelect = useCallback((objective: string) => {
    console.log("[useUnifiedStoryForm] Sélection objectif:", objective);
    setSelectedObjective(objective);
  }, []);

  /**
   * Gestionnaire de soumission du formulaire - unifié
   */
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[useUnifiedStoryForm] Soumission du formulaire");
    
    if (isSubmitting) {
      console.log("[useUnifiedStoryForm] Soumission déjà en cours, annulation");
      return;
    }
    
    try {
      // Valider le formulaire
      const validation = validateForm();
      if (!validation.isValid) {
        console.error("[useUnifiedStoryForm] Erreur de validation:", validation.error);
        setFormError(validation.error);
        return;
      }
      
      // Commencer la soumission
      setIsSubmitting(true);
      setFormError(null);
      
      // Notifier l'utilisateur
      toast({
        title: "Création en cours",
        description: "Nous préparons votre histoire, veuillez patienter..."
      });
      
      console.log("[useUnifiedStoryForm] Appel API avec données:", {
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      });
      
      // Appeler l'API
      const storyId = await onSubmit({
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      });
      
      console.log("[useUnifiedStoryForm] Histoire créée avec succès, ID:", storyId);
      
      // Notifier du succès intermédiaire
      toast({
        title: "Histoire en préparation",
        description: "Votre histoire est en cours de génération, vous serez redirigé(e) lorsqu'elle sera prête."
      });
      
      // Appeler le callback de succès
      if (onStoryCreated) {
        onStoryCreated({
          id: storyId,
          // Valeurs temporaires en attendant que la génération soit terminée
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
      
      // Réinitialiser le formulaire
      setSelectedChildrenIds([]);
      setSelectedObjective('');
      
    } catch (error: any) {
      console.error("[useUnifiedStoryForm] Erreur pendant la création:", error);
      setFormError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
      
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue pendant la création de l'histoire",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    validateForm,
    selectedChildrenIds,
    selectedObjective,
    onSubmit,
    onStoryCreated,
    toast
  ]);
  
  // Calcul de l'état du bouton
  const isGenerateButtonDisabled = useCallback(() => {
    const disabled = isSubmitting || selectedChildrenIds.length === 0 || !selectedObjective;
    
    console.log("[useUnifiedStoryForm] État du bouton:", { 
      disabled, 
      isSubmitting, 
      childrenSelected: selectedChildrenIds.length > 0, 
      objectiveSelected: !!selectedObjective 
    });
    
    return disabled;
  }, [isSubmitting, selectedChildrenIds, selectedObjective]);

  return {
    // État du formulaire
    selectedChildrenIds,
    selectedObjective,
    formError,
    isSubmitting,
    authLoading,
    
    // État du formulaire d'enfant
    showChildForm,
    setShowChildForm,
    
    // Gestionnaires
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit,
    
    // Utilitaires
    isGenerateButtonDisabled: isGenerateButtonDisabled()
  };
};

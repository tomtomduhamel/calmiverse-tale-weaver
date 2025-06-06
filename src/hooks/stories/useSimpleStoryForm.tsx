
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";

/**
 * Hook unifié et simplifié pour la gestion du formulaire d'histoire
 * Cette version supprime les couches intermédiaires et centralise toute la logique
 */
export const useSimpleStoryForm = (
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>,
  children: Child[] = [],
  onStoryCreated: (story: Story) => void
) => {
  // État du formulaire - centralisé en un seul endroit
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showChildForm, setShowChildForm] = useState<boolean>(false);
  
  // État pour le débogage
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  // Authentication et notifications
  const { user, session, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();
  
  // Logs de débogage pour suivre l'état du formulaire
  useEffect(() => {
    const currentState = { 
      selectedChildrenIds, 
      selectedObjective,
      isSubmitting,
      formError,
      userLoggedIn: !!user,
      childCount: children?.length || 0
    };
    
    console.log("[useSimpleStoryForm] État actuel:", currentState);
    setDebugInfo(currentState);
    
    // Tracer les enfants sélectionnés
    if (selectedChildrenIds.length > 0) {
      const selectedChildren = children.filter(child => selectedChildrenIds.includes(child.id));
      console.log("[useSimpleStoryForm] Enfants sélectionnés:", selectedChildren.map(c => ({ id: c.id, name: c.name })));
    }
  }, [selectedChildrenIds, selectedObjective, isSubmitting, formError, user, children]);
  
  // Effacer les erreurs quand la sélection change
  useEffect(() => {
    if (formError) {
      if ((formError.toLowerCase().includes('enfant') && selectedChildrenIds.length > 0) ||
          (formError.toLowerCase().includes('objectif') && selectedObjective)) {
        console.log("[useSimpleStoryForm] Effacement de l'erreur car les données ont été corrigées");
        setFormError(null);
      }
    }
  }, [selectedChildrenIds, selectedObjective, formError]);

  /**
   * Fonction de validation du formulaire - centralisée
   */
  const validateForm = useCallback(() => {
    console.log("[useSimpleStoryForm] Validation du formulaire:", {
      childrenIds: selectedChildrenIds, 
      objective: selectedObjective,
      hasUser: !!user,
      hasSession: !!session,
      childrenIdsLength: selectedChildrenIds.length
    });
    
    // Vérification de l'authentification
    if (!user || !session) {
      return { isValid: false, error: "Vous devez être connecté pour créer une histoire" };
    }
    
    // Vérification de la sélection d'enfant (vérification explicite de la longueur)
    if (!selectedChildrenIds || selectedChildrenIds.length === 0) {
      console.error("[useSimpleStoryForm] Erreur de validation: aucun enfant sélectionné");
      return { isValid: false, error: "Veuillez sélectionner au moins un enfant pour créer une histoire" };
    }
    
    // Vérification de l'objectif
    if (!selectedObjective) {
      console.error("[useSimpleStoryForm] Erreur de validation: aucun objectif sélectionné");
      return { isValid: false, error: "Veuillez sélectionner un objectif pour l'histoire" };
    }
    
    console.log("[useSimpleStoryForm] Validation réussie");
    return { isValid: true, error: null };
  }, [selectedChildrenIds, selectedObjective, user, session]);

  /**
   * Gestionnaire de sélection d'enfant - simplifiée et robuste
   */
  const handleChildSelect = useCallback((childId: string) => {
    if (!childId) {
      console.error("[useSimpleStoryForm] ID d'enfant invalide");
      return;
    }
    
    console.log("[useSimpleStoryForm] Sélection/désélection enfant:", childId);
    
    setSelectedChildrenIds(prev => {
      // Utiliser une approche basée sur ID plutôt que références d'objets
      const isSelected = prev.includes(childId);
      let newSelection: string[];
      
      if (isSelected) {
        // Désélectionner l'enfant
        newSelection = prev.filter(id => id !== childId);
      } else {
        // Sélectionner l'enfant
        newSelection = [...prev, childId];
      }
      
      console.log(`[useSimpleStoryForm] Enfant ${isSelected ? 'désélectionné' : 'sélectionné'}:`, childId);
      console.log("[useSimpleStoryForm] Nouvelle sélection:", newSelection);
      
      return newSelection;
    });
  }, []);

  /**
   * Gestionnaire de sélection d'objectif - simplifié
   */
  const handleObjectiveSelect = useCallback((objective: string) => {
    console.log("[useSimpleStoryForm] Sélection objectif:", objective);
    setSelectedObjective(objective);
  }, []);

  /**
   * Gestionnaire de soumission du formulaire - unifié et robuste
   */
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    // Empêcher le comportement par défaut du formulaire
    e.preventDefault();
    console.log("[useSimpleStoryForm] Soumission du formulaire");
    
    // Vérifier si une soumission est déjà en cours pour éviter les doublons
    if (isSubmitting) {
      console.log("[useSimpleStoryForm] Soumission déjà en cours, annulation");
      return;
    }
    
    try {
      // Valider le formulaire avec vérification explicite
      const validation = validateForm();
      
      if (!validation.isValid) {
        console.error("[useSimpleStoryForm] Erreur de validation:", validation.error);
        setFormError(validation.error);
        
        toast({
          title: "Erreur de validation",
          description: validation.error,
          variant: "destructive"
        });
        
        return;
      }
      
      // Commencer la soumission avec feedback immédiat
      setIsSubmitting(true);
      setFormError(null);
      
      // Journaliser explicitement les données envoyées
      console.log("[useSimpleStoryForm] Données soumises:", {
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      });
      
      // Notifier l'utilisateur du début du processus
      toast({
        title: "Création en cours",
        description: "Nous préparons votre histoire, veuillez patienter..."
      });
      
      // Appeler l'API avec vérifications de sécurité
      if (selectedChildrenIds.length === 0) {
        throw new Error("Aucun enfant sélectionné pour la création de l'histoire");
      }
      
      const storyId = await onSubmit({
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      });
      
      console.log("[useSimpleStoryForm] Histoire créée avec succès, ID:", storyId);
      
      // Notifier du succès
      toast({
        title: "Histoire en préparation",
        description: "Votre histoire est en cours de génération, vous serez redirigé(e) lorsqu'elle sera prête."
      });
      
      // Créer une histoire temporaire pour la transition
      if (onStoryCreated) {
        onStoryCreated({
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: selectedChildrenIds,
          createdAt: new Date(),
          status: 'pending',
          content: "", // CORRECTION: utiliser 'content' au lieu de 'story_text'
          story_summary: "",
          objective: selectedObjective
        } as Story);
      }
      
      // Réinitialiser le formulaire
      setSelectedChildrenIds([]);
      setSelectedObjective('');
      
    } catch (error: any) {
      console.error("[useSimpleStoryForm] Erreur pendant la création:", error);
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
  
  // Calcul de l'état du bouton avec vérification explicite
  const isGenerateButtonDisabled = useCallback(() => {
    const noChildrenSelected = !selectedChildrenIds || selectedChildrenIds.length === 0;
    const noObjectiveSelected = !selectedObjective;
    const disabled = isSubmitting || noChildrenSelected || noObjectiveSelected;
    
    console.log("[useSimpleStoryForm] État du bouton:", { 
      disabled, 
      isSubmitting, 
      childrenSelected: !noChildrenSelected, 
      objectiveSelected: !noObjectiveSelected,
      childrenIdsLength: selectedChildrenIds?.length || 0
    });
    
    return disabled;
  }, [isSubmitting, selectedChildrenIds, selectedObjective]);

  // Rendre les valeurs nécessaires pour le composant
  return {
    // États du formulaire
    selectedChildrenIds,
    selectedObjective,
    formError,
    isSubmitting,
    authLoading,
    showChildForm,
    
    // Setters pour modification directe
    setSelectedChildrenIds,
    setSelectedObjective,
    setShowChildForm,
    
    // Gestionnaires d'événements
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit,
    
    // État du bouton
    isGenerateButtonDisabled: isGenerateButtonDisabled(),
    
    // Informations de débogage
    debugInfo
  };
};

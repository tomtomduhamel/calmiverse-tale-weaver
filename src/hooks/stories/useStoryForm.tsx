
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import type { StoryFormData } from "@/components/story/StoryFormTypes";

export const useStoryForm = (onStoryCreated: Function, onSubmit: Function) => {
  const [formData, setFormData] = useState<StoryFormData>({
    childrenIds: [] as string[],
    objective: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, session, loading } = useSupabaseAuth();

  // Vérifier l'état de l'authentification au chargement du composant
  useEffect(() => {
    if (!loading) {
      console.log("État d'authentification dans useStoryForm:", { 
        user: user?.id, 
        sessionExists: !!session,
        loading
      });
      setAuthChecked(true);
    }
  }, [user, session, loading]);

  // Fonction de validation du formulaire avec debugging amélioré
  const validateForm = (): { isValid: boolean; error: string | null } => {
    console.log("validateForm - Données actuelles à valider:", {
      userId: user?.id,
      sessionExists: !!session,
      childrenIds: formData.childrenIds,
      objective: formData.objective,
      childrenIdsLength: formData.childrenIds?.length || 0,
      childrenIdsIsArray: Array.isArray(formData.childrenIds)
    });
    
    // Vérification de l'authentification
    if (!user || !session) {
      console.error("Validation échouée: utilisateur non connecté", { user, session });
      return {
        isValid: false,
        error: "Vous devez être connecté pour créer une histoire"
      };
    }

    // Vérification de la sélection d'enfant avec debug détaillé
    if (!formData.childrenIds || !Array.isArray(formData.childrenIds)) {
      console.error("Validation échouée: childrenIds n'est pas un tableau", { 
        childrenIds: formData.childrenIds,
        type: typeof formData.childrenIds 
      });
      return {
        isValid: false,
        error: "Veuillez sélectionner au moins un enfant pour créer une histoire"
      };
    }
    
    if (formData.childrenIds.length === 0) {
      console.error("Validation échouée: aucun enfant sélectionné", { 
        childrenIds: formData.childrenIds,
        length: formData.childrenIds.length 
      });
      return {
        isValid: false,
        error: "Veuillez sélectionner au moins un enfant pour créer une histoire"
      };
    }

    // Vérification de l'objectif
    if (!formData.objective) {
      console.error("Validation échouée: aucun objectif sélectionné", { objective: formData.objective });
      return {
        isValid: false,
        error: "Veuillez sélectionner un objectif pour l'histoire"
      };
    }

    console.log("Validation réussie, données valides:", { ...formData });
    return { isValid: true, error: null };
  };

  const handleChildToggle = (childId: string) => {
    console.log("Toggle enfant - DÉBUT:", {
      childId, 
      "État actuel": formData.childrenIds,
      "Est tableau?": Array.isArray(formData.childrenIds)
    });
    
    // Vérifier que childId est une chaîne valide
    if (!childId || typeof childId !== 'string') {
      console.error("ChildId invalide:", childId);
      return;
    }
    
    setFormData((prev) => {
      // S'assurer que nous avons toujours un tableau valide
      const currentIds = Array.isArray(prev.childrenIds) ? [...prev.childrenIds] : [];
      
      // Vérifier si l'ID est déjà présent
      const isSelected = currentIds.includes(childId);
      
      // Créer un nouveau tableau avec ou sans l'ID
      const updatedIds = isSelected
        ? currentIds.filter((id) => id !== childId)
        : [...currentIds, childId];
        
      console.log("Toggle enfant - APRÈS traitement:", {
        "ID enfant": childId,
        "État précédent": currentIds,
        "Déjà sélectionné?": isSelected,
        "Nouvel état": updatedIds
      });
      
      // Retourner le nouvel état avec le tableau mis à jour
      return { 
        ...prev, 
        childrenIds: updatedIds 
      };
    });
    
    // Réinitialiser l'erreur si elle concerne la sélection d'enfants
    if (error && error.includes("Veuillez sélectionner au moins un enfant")) {
      setError(null);
    }
  };

  const setObjective = (objective: string) => {
    console.log("Nouvel objectif sélectionné:", objective);
    setFormData((prev) => ({ ...prev, objective }));
    
    // Réinitialiser l'erreur si elle concerne l'objectif
    if (error && error.includes("Veuillez sélectionner un objectif")) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      console.log("Soumission déjà en cours, ignorée");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Début de soumission du formulaire avec données:", {
        childrenIds: formData.childrenIds,
        objective: formData.objective,
        childrenIdsLength: formData.childrenIds?.length || 0
      });
      
      // Valider le formulaire avant de continuer
      const validation = validateForm();
      if (!validation.isValid) {
        console.error("Erreur de validation:", validation.error);
        setError(validation.error);
        throw new Error(validation.error || "Erreur de validation");
      }
      
      // Réinitialiser l'erreur si la validation a réussi
      setError(null);
      console.log("Tentative de création d'histoire, données validées:", formData);

      // Appeler la fonction de création d'histoire
      const storyId = await onSubmit(formData);
      console.log("Histoire créée avec succès, ID:", storyId);
      
      if (storyId && onStoryCreated) {
        onStoryCreated(storyId);
      }
      
      toast({
        title: "Histoire en cours de création",
        description: "Nous générons votre histoire, cela peut prendre quelques instants.",
      });
      
      // Réinitialiser le formulaire
      setFormData({
        childrenIds: [],
        objective: "",
      });
      
      return storyId;
    } catch (error: any) {
      console.error("Erreur lors de la création de l'histoire:", error);
      
      // Ne pas écraser une erreur de validation si elle existe déjà
      if (!error) {
        setError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
      }
      
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la création de l'histoire",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetError = () => setError(null);

  return {
    formData,
    isLoading,
    isSubmitting,
    error,
    authChecked,
    handleChildToggle,
    setObjective,
    handleSubmit,
    resetError,
    validateForm,
  };
};

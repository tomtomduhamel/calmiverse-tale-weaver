
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

  const handleChildToggle = (childId: string) => {
    setFormData((prev) => {
      const childrenIds = prev.childrenIds.includes(childId)
        ? prev.childrenIds.filter((id) => id !== childId)
        : [...prev.childrenIds, childId];
      return { ...prev, childrenIds };
    });
  };

  const setObjective = (objective: string) => {
    setFormData((prev) => ({ ...prev, objective }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      console.log("Tentative de création d'histoire, données du formulaire:", formData);
      console.log("État auth:", { 
        user: user?.id,
        sessionExists: !!session,
        authChecked
      });

      // Validation de l'authentification
      if (!user || !session) {
        console.error("Erreur d'authentification: Utilisateur non connecté", { user, session });
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour créer une histoire",
          variant: "destructive",
        });
        throw new Error("Utilisateur non connecté");
      }

      // Validation des données
      if (!formData.childrenIds || formData.childrenIds.length === 0) {
        console.error("Erreur: Aucun enfant sélectionné", formData);
        throw new Error("Veuillez sélectionner au moins un enfant");
      }

      if (!formData.objective) {
        console.error("Erreur: Aucun objectif sélectionné", formData);
        throw new Error("Veuillez sélectionner un objectif pour l'histoire");
      }

      console.log("Création d'histoire avec les données:", { 
        formData, 
        userId: user.id
      });
      
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
      setError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
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
  };
};

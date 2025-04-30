
import { useState, useEffect } from "react";
import { useSupabaseChildren } from "./useSupabaseChildren";
import { useSupabaseStories } from "./useSupabaseStories";
import { useToast } from "./use-toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

export const useStoryForm = (onStoryCreated: Function, onSubmit: Function) => {
  const [formData, setFormData] = useState({
    childrenIds: [] as string[],
    objective: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { children } = useSupabaseChildren();
  const { createStory } = useSupabaseStories();
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
      console.log("Tentative de création d'histoire, état auth:", { 
        user: user?.id,
        sessionExists: !!session,
        authChecked
      });

      // Double vérification de l'authentification
      if (!user || !session) {
        console.error("Erreur d'authentification: Utilisateur non connecté", { user, session });
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour créer une histoire",
          variant: "destructive",
        });
        throw new Error("Utilisateur non connecté");
      }

      if (!formData.objective) {
        throw new Error("Veuillez sélectionner un objectif pour l'histoire");
      }

      if (formData.childrenIds.length === 0) {
        throw new Error("Veuillez sélectionner au moins un enfant");
      }

      console.log("Création d'histoire avec les données:", { 
        formData, 
        userId: user.id,
        childrenCount: children.length
      });
      
      // Appeler la fonction de création d'histoire
      const storyId = await createStory(formData, children);
      console.log("Histoire créée avec succès, ID:", storyId);
      
      if (onStoryCreated) {
        onStoryCreated(storyId);
      }
      
      if (onSubmit) {
        onSubmit(formData);
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

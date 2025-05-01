
import React, { useState, useEffect } from "react";
import type { StoryFormProps } from "./story/StoryFormTypes";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { useStoryForm } from "@/hooks/useStoryForm";
import LoadingStory from "./LoadingStory";
import CreateChildDialog from "./story/CreateChildDialog";
import StoryChat from "./story/chat/StoryChat";
import { useChildFormLogic } from "./story/useChildFormLogic";
import { StoryFormContent } from "./story/form/StoryFormContent";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { StoryError } from "./story/form/StoryError";

const StoryForm: React.FC<StoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  const [creationMode, setCreationMode] = useState<"classic" | "chat">("classic");
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  const { formData, isLoading, error, authChecked, handleChildToggle, setObjective, handleSubmit, resetError } = useStoryForm(onStoryCreated, onSubmit);
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const {
    showChildForm,
    setShowChildForm,
    childName,
    childAge,
    handleChildFormSubmit,
    resetChildForm,
    setChildName,
    setChildAge,
  } = useChildFormLogic(onCreateChild);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Vérifier si l'utilisateur est connecté et rediriger vers la page d'authentification si nécessaire
  useEffect(() => {
    console.log("Vérification de l'authentification dans StoryForm", { 
      user: user?.id, 
      authLoading,
      authChecked
    });
    
    if (!authLoading && !user) {
      console.log("Utilisateur non connecté, affichage de l'erreur");
      setFormError("Utilisateur non connecté");
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer une histoire",
        variant: "destructive",
      });
    } else if (user) {
      console.log("Utilisateur connecté:", user.id);
      setFormError(null);
    }
  }, [user, authLoading, toast, authChecked]);

  // Écouter les erreurs du processus de génération d'histoire
  useEffect(() => {
    const handleAppNotification = (event: CustomEvent) => {
      if (event.detail.type === 'error') {
        setFormError(event.detail.message || "Une erreur est survenue");
        setIsSubmitting(false);
        setProgress(0);
      } else if (event.detail.type === 'success') {
        setFormError(null);
      }
    };
    
    document.addEventListener('app-notification', handleAppNotification as EventListener);
    
    return () => {
      document.removeEventListener('app-notification', handleAppNotification as EventListener);
    };
  }, []);

  // Simuler la progression pour une meilleure expérience utilisateur
  useEffect(() => {
    if (isSubmitting) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const increment = Math.random() * 5;
          const newValue = prev + increment;
          return newValue >= 95 ? 95 : newValue;
        });
      }, 500);
      
      return () => clearInterval(interval);
    } else if (progress !== 0 && progress !== 100) {
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [isSubmitting, progress]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-primary">Vérification de l'authentification...</div>
      </div>
    );
  }

  if (objectivesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-primary">Chargement des objectifs...</div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingStory />;
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      setFormError("Utilisateur non connecté");
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer une histoire",
        variant: "destructive",
      });
      return;
    }
    
    // Vérifier que des enfants ont été sélectionnés
    if (formData.childrenIds.length === 0) {
      setFormError("Veuillez sélectionner au moins un enfant");
      toast({
        title: "Erreur", 
        description: "Veuillez sélectionner au moins un enfant",
        variant: "destructive",
      });
      return;
    }

    // Vérifier qu'un objectif a été sélectionné
    if (!formData.objective) {
      setFormError("Veuillez sélectionner un objectif pour l'histoire");
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un objectif pour l'histoire",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Soumission du formulaire avec utilisateur:", user.id);
      console.log("Données du formulaire:", formData);
      await handleSubmit(e);
      
      toast({
        title: "Création en cours",
        description: "Votre histoire est en cours de génération",
      });
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      setFormError(error instanceof Error ? error.message : "Une erreur est survenue");
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {creationMode === "classic" ? (
        <>
          {formError && <StoryError error={formError} />}
          <StoryFormContent
            children={children}
            selectedChildrenIds={formData.childrenIds}
            onChildToggle={handleChildToggle}
            onCreateChildClick={() => setShowChildForm(true)}
            objective={formData.objective}
            setObjective={setObjective}
            objectives={objectives || [
              { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
              { id: "focus", label: "Se concentrer", value: "focus" },
              { id: "relax", label: "Se détendre", value: "relax" },
              { id: "fun", label: "S'amuser", value: "fun" },
            ]}
            isSubmitting={isSubmitting}
            progress={progress}
            formError={formError || error}
            onSubmit={handleFormSubmit}
            onModeSwitch={() => setCreationMode("chat")}
          />
        </>
      ) : (
        <div className="animate-fade-in">
          <StoryChat onSwitchMode={() => setCreationMode("classic")} />
        </div>
      )}

      <CreateChildDialog
        open={showChildForm}
        onOpenChange={setShowChildForm}
        childName={childName}
        childAge={childAge}
        onSubmit={handleChildFormSubmit}
        onReset={resetChildForm}
        onChildNameChange={setChildName}
        onChildAgeChange={setChildAge}
      />
    </div>
  );
};

export default StoryForm;

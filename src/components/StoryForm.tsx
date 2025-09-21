
import React, { useState, useEffect } from "react";
import type { StoryFormProps } from "./story/StoryFormTypes";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { Loader2 } from "lucide-react";
import DirectStoryForm from "./story/form/DirectStoryForm";

/**
 * Composant principal pour le formulaire d'histoire
 * Version simplifiée avec gestion d'état directe pour éviter les problèmes de synchronisation
 */
const StoryForm: React.FC<StoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  // Charger les objectifs pour les histoires
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  
  // État local du formulaire
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Objectifs par défaut si le chargement échoue
  const defaultObjectives = [
    { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
    { id: "focus", label: "Se concentrer", value: "focus" },
    { id: "relax", label: "Se relaxer", value: "relax" },
    { id: "fun", label: "S'amuser", value: "fun" },
  ];
  

  // Réinitialiser l'erreur quand la sélection change
  useEffect(() => {
    if (formError) {
      if ((formError.toLowerCase().includes('enfant') && selectedChildrenIds.length > 0) ||
          (formError.toLowerCase().includes('objectif') && selectedObjective)) {
        
        setFormError(null);
      }
    }
  }, [selectedChildrenIds, selectedObjective, formError]);
  
  // Afficher un indicateur de chargement pendant le chargement des objectifs
  if (objectivesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Chargement des objectifs...</p>
        </div>
      </div>
    );
  }
  
  // Gérer la sélection d'un enfant
  const handleChildSelect = (childId: string) => {
    setSelectedChildrenIds(prev => {
      const isAlreadySelected = prev.includes(childId);
      return isAlreadySelected 
        ? prev.filter(id => id !== childId) 
        : [...prev, childId];
    });
  };
  
  // Gérer la sélection d'un objectif
  const handleObjectiveSelect = (objective: string) => {
    
    setSelectedObjective(objective);
  };
  
  // Valider le formulaire
  const validateForm = () => {
    
    if (!selectedChildrenIds || selectedChildrenIds.length === 0) {
      return { isValid: false, error: "Veuillez sélectionner au moins un enfant pour créer une histoire" };
    }
    
    if (!selectedObjective) {
      return { isValid: false, error: "Veuillez sélectionner un objectif pour l'histoire" };
    }
    
    return { isValid: true, error: null };
  };
  
  // Gérer la soumission du formulaire
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    
    if (isSubmitting) {
      
      return;
    }
    
    // Valider le formulaire
    const validation = validateForm();
    if (!validation.isValid) {
      setFormError(validation.error);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      
      const storyId = await onSubmit({
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      });
      
      
      
      // Appeler le callback de succès avec navigation immédiate
      if (storyId && onStoryCreated) {
        onStoryCreated({
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: selectedChildrenIds,
          createdAt: new Date(),
          status: 'pending',
          content: "",
          story_summary: "",
          objective: selectedObjective
        });
      }
      
      // Réinitialiser le formulaire pour permettre une nouvelle création
      setSelectedChildrenIds([]);
      setSelectedObjective("");
      
      // Ne pas attendre - la génération se fait en arrière-plan
      console.log("[StoryForm] Soumission terminée, navigation immédiate");
      
    } catch (error: any) {
      console.error("[StoryForm] Erreur pendant la création:", error);
      setFormError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <DirectStoryForm
      children={children}
      onCreateChild={onCreateChild}
      objectives={objectives || defaultObjectives}
      selectedChildrenIds={selectedChildrenIds}
      selectedObjective={selectedObjective}
      isSubmitting={isSubmitting}
      formError={formError}
      onChildSelect={handleChildSelect}
      onObjectiveSelect={handleObjectiveSelect}
      onSubmit={handleFormSubmit}
    />
  );
};

export default StoryForm;

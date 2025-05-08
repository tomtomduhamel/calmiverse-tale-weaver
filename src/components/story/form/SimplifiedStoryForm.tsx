
import React, { useState } from "react";
import { StoryFormProvider } from "@/contexts/StoryFormContext";
import RobustStoryForm from "./RobustStoryForm";
import CreateChildDialog from "../CreateChildDialog";
import type { Child } from "@/types/child";
import type { Objective } from "@/types/story";
import type { Story } from "@/types/story";

interface SimplifiedStoryFormProps {
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onStoryCreated: (story: Story) => void;
  objectives: Objective[];
}

/**
 * Formulaire d'histoire simplifié qui utilise le nouveau contexte centralisé
 * Version robuste avec journalisation détaillée
 */
const SimplifiedStoryForm: React.FC<SimplifiedStoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
  objectives
}) => {
  // État du formulaire d'enfant
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("1");
  const [showChildForm, setShowChildForm] = useState(false);
  
  // Log de débogage pour vérifier les props
  console.log("[SimplifiedStoryForm] Initialisation avec:", {
    childrenCount: children?.length || 0,
    objectivesCount: objectives?.length || 0,
    hasOnSubmit: !!onSubmit,
    hasOnCreateChild: !!onCreateChild,
    hasOnStoryCreated: !!onStoryCreated
  });
  
  // Vérification explicite des props
  if (!onSubmit || !onCreateChild || !onStoryCreated) {
    console.error("[SimplifiedStoryForm] Props manquantes:", {
      onSubmit: !!onSubmit,
      onCreateChild: !!onCreateChild,
      onStoryCreated: !!onStoryCreated
    });
  }
  
  // Gestionnaire pour la soumission du formulaire d'enfant
  const handleChildFormSubmit = async (name: string, age: string) => {
    try {
      console.log("[SimplifiedStoryForm] Création d'enfant avec nom:", name, "et âge:", age);
      
      if (!name.trim()) {
        console.error("[SimplifiedStoryForm] Nom d'enfant vide");
        return;
      }
      
      if (!onCreateChild) {
        console.error("[SimplifiedStoryForm] onCreateChild n'est pas défini");
        return;
      }
      
      // Calculer la date de naissance à partir de l'âge
      const now = new Date();
      const birthYear = now.getFullYear() - parseInt(age);
      const birthDate = new Date(birthYear, now.getMonth(), now.getDate());
      
      // Créer l'enfant
      const childId = await onCreateChild({
        name: name,
        birthDate: birthDate,
        interests: [],
        gender: 'unknown',
        authorId: ''  // Sera rempli par le backend
      });
      
      console.log("[SimplifiedStoryForm] Enfant créé avec ID:", childId);
      
      // Fermer le formulaire
      setShowChildForm(false);
      resetChildForm();
    } catch (error) {
      console.error("[SimplifiedStoryForm] Erreur lors de la création d'enfant:", error);
    }
  };
  
  // Réinitialiser le formulaire d'enfant
  const resetChildForm = () => {
    setChildName("");
    setChildAge("1");
  };
  
  // Gestionnaire pour ouvrir le formulaire de création d'enfant
  const handleCreateChildClick = () => {
    console.log("[SimplifiedStoryForm] Ouverture du formulaire de création d'enfant");
    setShowChildForm(true);
  };
  
  // Gestionnaire de soumission personnalisé pour ajouter des logs supplémentaires
  const handleFormSubmitWithLogging = async (formData: { childrenIds: string[], objective: string }) => {
    console.log("[SimplifiedStoryForm] Soumission du formulaire avec données:", formData);
    
    // Vérifications explicites
    if (!formData.childrenIds || formData.childrenIds.length === 0) {
      console.error("[SimplifiedStoryForm] Erreur: aucun enfant sélectionné");
      throw new Error("Veuillez sélectionner au moins un enfant");
    }
    
    if (!formData.objective) {
      console.error("[SimplifiedStoryForm] Erreur: aucun objectif sélectionné");
      throw new Error("Veuillez sélectionner un objectif");
    }
    
    if (!onSubmit) {
      console.error("[SimplifiedStoryForm] Erreur: onSubmit n'est pas défini");
      throw new Error("Erreur de configuration du formulaire");
    }
    
    // Appeler le gestionnaire de soumission
    try {
      const storyId = await onSubmit(formData);
      console.log("[SimplifiedStoryForm] Histoire créée avec succès, ID:", storyId);
      return storyId;
    } catch (error: any) {
      console.error("[SimplifiedStoryForm] Erreur lors de la création de l'histoire:", error);
      throw error;
    }
  };
  
  return (
    <StoryFormProvider 
      onSubmit={handleFormSubmitWithLogging} 
      availableChildren={children} 
      onStoryCreated={onStoryCreated}
    >
      <RobustStoryForm 
        children={children}
        onCreateChildClick={handleCreateChildClick}
        objectives={objectives}
      />
      
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
    </StoryFormProvider>
  );
};

export default SimplifiedStoryForm;

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StoryError } from "./StoryError";
import SimpleChildSelector from "./SimpleChildSelector";
import CreateChildDialog from "../CreateChildDialog";
import { default as StoryObjectives } from "../StoryObjectives";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Wand2, Loader2 } from "lucide-react";
import { useUnifiedStoryForm } from "@/hooks/stories/useUnifiedStoryForm";

interface SimpleStoryFormProps {
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>;
  onStoryCreated: (story: Story) => void;
  objectives: { id: string, label: string, value: string }[];
}

const SimpleStoryForm: React.FC<SimpleStoryFormProps> = ({
  children,
  onCreateChild,
  onSubmit,
  onStoryCreated,
  objectives = []
}) => {
  const isMobile = useIsMobile();
  
  // Utilisation du hook unifié pour la gestion du formulaire
  const {
    selectedChildrenIds,
    selectedObjective,
    formError,
    isSubmitting,
    showChildForm,
    setShowChildForm,
    authLoading,
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit,
    isGenerateButtonDisabled
  } = useUnifiedStoryForm(onSubmit, children, onStoryCreated);

  // Détection des erreurs spécifiques
  const hasChildrenError = formError && formError.toLowerCase().includes('enfant');
  const hasObjectiveError = formError && formError.toLowerCase().includes('objectif');
  
  // État pour le formulaire de création d'enfant
  const [childName, setChildName] = React.useState("");
  const [childAge, setChildAge] = React.useState("1");
  
  // Gestionnaire pour ouvrir le formulaire de création d'enfant
  const handleCreateChildClick = () => {
    setShowChildForm(true);
  };
  
  // Gestionnaire pour la soumission du formulaire d'enfant (signature modifiée)
  const handleChildFormSubmit = async () => {
    try {
      console.log("Creating child with name:", childName, "and age:", childAge);
      
      // Calculer la date de naissance à partir de l'âge
      const now = new Date();
      const birthYear = now.getFullYear() - parseInt(childAge);
      const birthDate = new Date(birthYear, now.getMonth(), now.getDate());
      
      // Créer l'enfant
      await onCreateChild({
        name: childName,
        birthDate,
        interests: [],
        gender: 'unknown',
        authorId: ''  // Sera rempli par le backend
      });
      
      // Fermer le formulaire
      setShowChildForm(false);
      
      // Réinitialiser le formulaire
      setChildName("");
      setChildAge("1");
    } catch (error) {
      console.error("Error creating child:", error);
    }
  };
  
  // Réinitialiser le formulaire d'enfant
  const resetChildForm = () => {
    setChildName("");
    setChildAge("1");
  };
  
  // Si l'authentification est en cours, afficher un indicateur de chargement
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Chargement...</span>
      </div>
    );
  }

  // Hauteur calculée pour éviter les problèmes de mise en page
  const scrollAreaHeight = isMobile ? "h-[calc(100vh-250px)]" : "h-[calc(100vh-180px)]";

  return (
    <div className="flex flex-col h-full w-full">
      <ScrollArea className={scrollAreaHeight}>
        <form 
          onSubmit={handleFormSubmit}
          className="space-y-6 animate-fade-in bg-white dark:bg-muted-dark p-4 sm:p-8 rounded-xl shadow-soft-lg transition-all hover:shadow-xl mx-auto max-w-[95%] sm:max-w-4xl mb-20"
          data-testid="story-form"
        >
          <h2 className="text-2xl font-bold text-primary">Créer une histoire personnalisée</h2>
          
          {formError && (
            <StoryError error={formError} className="animate-pulse" />
          )}
          
          <div className={`space-y-4 ${hasChildrenError ? 'ring-2 ring-destructive/20 rounded-lg p-4' : ''}`}>
            <SimpleChildSelector
              children={children}
              selectedChildrenIds={selectedChildrenIds}
              onChildSelect={handleChildSelect}
              onCreateChildClick={handleCreateChildClick}
              hasError={hasChildrenError}
            />
          </div>

          <div className={`space-y-4 ${hasObjectiveError ? 'ring-2 ring-destructive/20 rounded-lg p-4' : ''}`}>
            <label className="text-secondary dark:text-white text-base sm:text-lg font-medium">
              Je souhaite créer un moment de lecture qui va...
            </label>
            <StoryObjectives
              objectives={objectives}
              selectedObjective={selectedObjective}
              onObjectiveSelect={handleObjectiveSelect}
              hasError={hasObjectiveError}
            />
          </div>
          
          <div className="mt-6">
            <Button
              type="submit"
              disabled={isGenerateButtonDisabled}
              className="w-full py-4 sm:py-6 text-base sm:text-lg font-bold transition-all animate-fade-in shadow-lg"
              data-testid="generate-story-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Générer mon histoire
                </>
              )}
            </Button>
          </div>
        </form>
      </ScrollArea>
      
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

export default SimpleStoryForm;

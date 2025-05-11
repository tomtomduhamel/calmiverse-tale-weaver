
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Child } from "@/types/child";
import type { Objective, Story } from "@/types/story";

interface SimpleStoryFormProps {
  children: Child[];
  objectives: Objective[];
  onSubmit: (data: { childrenIds: string[]; objective: string }) => Promise<string>;
  onStoryCreated: (story: Story) => void;
  onCreateChild?: () => void;
}

const SimpleStoryForm: React.FC<SimpleStoryFormProps> = ({
  children,
  objectives,
  onSubmit,
  onStoryCreated,
  onCreateChild,
}) => {
  // État local direct sans hooks complexes
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(process.env.NODE_ENV === "development");
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // Log pour aider au débogage
  console.log("[SimpleStoryForm] Render with:", {
    selectedChildIds: selectedChildrenIds,
    selectedObjective,
    childrenCount: children?.length || 0,
    isSubmitting,
    formError
  });
  
  // Gestionnaire de sélection d'enfant simple et direct
  const handleChildSelect = (childId: string) => {
    console.log("[SimpleStoryForm] Toggling child selection:", childId);
    
    // Vérifier que l'ID est valide
    if (!childId) {
      console.error("[SimpleStoryForm] Invalid childId received");
      return;
    }
    
    setSelectedChildrenIds(currentIds => {
      const isCurrentlySelected = currentIds.includes(childId);
      const newSelection = isCurrentlySelected 
        ? currentIds.filter(id => id !== childId)
        : [...currentIds, childId];
      
      console.log(`[SimpleStoryForm] Child ${isCurrentlySelected ? 'unselected' : 'selected'}:`, childId);
      console.log("[SimpleStoryForm] New selection:", newSelection);
      
      return newSelection;
    });
  };
  
  // Gestionnaire de sélection d'objectif simple
  const handleObjectiveSelect = (objective: string) => {
    console.log("[SimpleStoryForm] Selecting objective:", objective);
    setSelectedObjective(objective);
  };
  
  // Validation simple avant soumission
  const validateForm = () => {
    // Vérifier que des enfants sont sélectionnés
    if (!selectedChildrenIds.length) {
      setFormError("Veuillez sélectionner au moins un enfant pour créer une histoire");
      return false;
    }
    
    // Vérifier qu'un objectif est sélectionné
    if (!selectedObjective) {
      setFormError("Veuillez sélectionner un objectif pour l'histoire");
      return false;
    }
    
    return true;
  };
  
  // Gestionnaire de soumission avec vérifications explicites
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[SimpleStoryForm] Form submitted");
    
    // Afficher les données explicitement
    console.log("[SimpleStoryForm] Form data on submit:", {
      selectedChildrenIds,
      selectedObjective,
      childrenCount: selectedChildrenIds.length
    });
    
    // Effacer les erreurs précédentes
    setFormError(null);
    
    // Validation avant de continuer
    if (!validateForm()) {
      console.error("[SimpleStoryForm] Validation failed");
      return;
    }
    
    try {
      // Activer l'état de chargement
      setIsSubmitting(true);
      
      console.log("[SimpleStoryForm] Submitting data:", {
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      });
      
      // Appeler l'API
      const storyId = await onSubmit({
        childrenIds: [...selectedChildrenIds], // Copie pour éviter les mutations
        objective: selectedObjective
      });
      
      console.log("[SimpleStoryForm] Story created successfully, ID:", storyId);
      
      // Appel du callback avec une histoire temporaire
      if (storyId && onStoryCreated) {
        const tempStory: Story = {
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: [...selectedChildrenIds],
          createdAt: new Date(),
          status: 'pending',
          story_text: "",
          story_summary: "",
          objective: selectedObjective
        };
        
        console.log("[SimpleStoryForm] Calling onStoryCreated with:", tempStory);
        onStoryCreated(tempStory);
      }
      
      // Réinitialiser le formulaire
      setSelectedChildrenIds([]);
      setSelectedObjective("");
      
      toast({
        title: "Création réussie",
        description: "Votre histoire est en cours de génération"
      });
      
    } catch (error: any) {
      console.error("[SimpleStoryForm] Error during submission:", error);
      setFormError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
      
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la création de l'histoire",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Vérifier si le bouton est désactivé
  const isButtonDisabled = isSubmitting || selectedChildrenIds.length === 0 || !selectedObjective;
  
  // Hauteur calculée pour l'aire de défilement
  const scrollAreaHeight = isMobile ? "h-[calc(100vh-250px)]" : "h-[calc(100vh-180px)]";
  
  return (
    <div className="flex flex-col h-full w-full">
      <ScrollArea className={scrollAreaHeight}>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 animate-fade-in bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg mx-auto max-w-[95%] sm:max-w-4xl mb-20"
          data-testid="simple-story-form"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Créer une nouvelle histoire</h1>
            <p className="text-muted-foreground">
              Personnalisez une histoire magique pour un moment unique
            </p>
          </div>
          
          {/* Affichage des erreurs */}
          {formError && (
            <div className="bg-destructive/10 border border-destructive p-4 rounded-lg text-destructive">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>{formError}</span>
              </div>
            </div>
          )}
          
          {/* Mode débogage (uniquement en développement) */}
          {debugMode && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg text-xs">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">Mode débogage</h3>
                <button
                  type="button"
                  className="text-xs bg-yellow-100 dark:bg-yellow-800 px-2 py-1 rounded"
                  onClick={() => setDebugMode(!debugMode)}
                >
                  Masquer
                </button>
              </div>
              <div className="mt-2 space-y-1">
                <p>Enfants sélectionnés: 
                  <span className="font-mono bg-white dark:bg-gray-800 px-1 ml-1 rounded">
                    {JSON.stringify(selectedChildrenIds)}
                  </span>
                </p>
                <p>Objectif sélectionné: 
                  <span className="font-mono bg-white dark:bg-gray-800 px-1 ml-1 rounded">
                    {selectedObjective || "aucun"}
                  </span>
                </p>
                <p>Formulaire valide:
                  <span className={`font-mono px-1 ml-1 rounded ${
                    !isButtonDisabled 
                      ? "bg-green-100 dark:bg-green-900" 
                      : "bg-red-100 dark:bg-red-900"
                  }`}>
                    {!isButtonDisabled ? "oui" : "non"}
                  </span>
                </p>
              </div>
            </div>
          )}
          
          {/* Sélecteur d'enfants */}
          <div className="space-y-4">
            <div className="text-lg font-medium">
              Pour qui est cette histoire ?
            </div>
            
            {children.length > 0 ? (
              <div className="space-y-2">
                {children.map((child) => {
                  const isSelected = selectedChildrenIds.includes(child.id);
                  
                  return (
                    <div
                      key={child.id}
                      onClick={() => handleChildSelect(child.id)}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 hover:bg-primary/20" 
                          : "hover:bg-muted/50 dark:hover:bg-muted-dark/50"
                      }`}
                      data-testid={`child-item-${child.id}`}
                      data-selected={isSelected ? "true" : "false"}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          isSelected 
                            ? "bg-primary border-primary text-white" 
                            : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
                        }`}>
                          {isSelected && (
                            <svg 
                              viewBox="0 0 24 24" 
                              width="16" 
                              height="16" 
                              stroke="currentColor" 
                              strokeWidth="3" 
                              fill="none" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      <div className={`text-base font-medium leading-none transition-all ${
                        isSelected ? "font-semibold text-primary" : ""
                      }`}>
                        {child.name} ({new Date().getFullYear() - new Date(child.birthDate).getFullYear()} ans)
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">Aucun profil enfant disponible.</p>
              </div>
            )}
            
            {onCreateChild && (
              <Button
                type="button"
                onClick={onCreateChild}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 py-4 border-dashed"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="16" y1="11" x2="22" y2="11"></line>
                </svg>
                {children.length > 0 ? "Ajouter un autre enfant" : "Créer un profil enfant"}
              </Button>
            )}
          </div>
          
          {/* Sélecteur d'objectifs */}
          <div className="space-y-4">
            <div className="text-lg font-medium">
              Je souhaite créer un moment de lecture qui va...
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {objectives.map((objective) => (
                <div
                  key={objective.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border border-muted hover:bg-muted/30 dark:hover:bg-muted-dark/30 transition-colors cursor-pointer ${
                    selectedObjective === objective.value
                      ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                      : "bg-white dark:bg-gray-800"
                  }`}
                  onClick={() => handleObjectiveSelect(objective.value)}
                  data-testid={`objective-item-${objective.id}`}
                  data-selected={selectedObjective === objective.value ? "true" : "false"}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedObjective === objective.value
                      ? "border-primary bg-primary"
                      : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {selectedObjective === objective.value && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div
                    className={`text-base font-medium cursor-pointer ${
                      selectedObjective === objective.value && "font-semibold text-primary"
                    }`}
                  >
                    {objective.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Bouton de soumission */}
          <div className="mt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto sm:px-8 relative overflow-hidden transition-all"
              size="lg"
              disabled={isButtonDisabled}
              data-testid="generate-story-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Générer une histoire
                </>
              )}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
};

export default SimpleStoryForm;

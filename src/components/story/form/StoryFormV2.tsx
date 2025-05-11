
import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import type { Child } from "@/types/child";
import type { Objective, Story } from "@/types/story";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

interface StoryFormV2Props {
  children: Child[];
  objectives: Objective[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  onStoryCreated: (story: Story) => void;
}

/**
 * Version complètement réécrite du formulaire de création d'histoire
 * avec gestion d'état simplifiée et robuste
 */
const StoryFormV2: React.FC<StoryFormV2Props> = ({
  children,
  objectives,
  onCreateChild,
  onSubmit,
  onStoryCreated
}) => {
  // État local pour le formulaire
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(process.env.NODE_ENV === "development");
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // Log détaillé à chaque rendu pour trouver l'origine du problème
  console.log("[StoryFormV2] Rendu avec", {
    childrenCount: children?.length || 0,
    selectedChildrenIds: JSON.stringify(selectedChildrenIds),
    selectedChildrenCount: selectedChildrenIds.length,
    selectedObjective,
    isSubmitting,
    formError,
    timestamp: new Date().toISOString()
  });
  
  // Déterminer si le bouton est désactivé
  const isButtonDisabled = isSubmitting || 
    !Array.isArray(selectedChildrenIds) || 
    selectedChildrenIds.length === 0 || 
    !selectedObjective;

  // Gestionnaire de sélection d'enfant avec vérification explicite
  const handleChildSelect = (childId: string) => {
    console.log("[StoryFormV2] handleChildSelect appelé avec:", childId);
    console.log("[StoryFormV2] État actuel:", selectedChildrenIds);
    
    if (!childId) {
      console.error("[StoryFormV2] ID d'enfant invalide");
      return;
    }
    
    // Vérification que l'enfant existe bien
    const childExists = children.some(child => child.id === childId);
    if (!childExists) {
      console.error("[StoryFormV2] Enfant non trouvé:", childId);
      return;
    }
    
    setSelectedChildrenIds(prev => {
      // Crée une copie pour éviter les mutations
      const newSelectedIds = [...prev];
      const index = newSelectedIds.indexOf(childId);
      
      // Si déjà sélectionné, retire de la liste
      if (index !== -1) {
        newSelectedIds.splice(index, 1);
      } else {
        // Sinon ajoute à la liste
        newSelectedIds.push(childId);
      }
      
      console.log("[StoryFormV2] Nouvelle sélection:", newSelectedIds);
      return newSelectedIds;
    });
  };
  
  // Gestionnaire de sélection d'objectif
  const handleObjectiveSelect = (objective: string) => {
    console.log("[StoryFormV2] handleObjectiveSelect:", objective);
    setSelectedObjective(objective);
    
    // Effacer les erreurs liées aux objectifs
    if (formError && formError.toLowerCase().includes("objectif")) {
      setFormError(null);
    }
  };
  
  // Gestionnaire pour l'ouverture du formulaire de création d'enfant
  const handleCreateChildClick = () => {
    console.log("[StoryFormV2] Demande d'ouverture du formulaire de création d'enfant");
    // À implémenter avec un dialog
  };
  
  // Gestionnaire de soumission du formulaire avec validation renforcée
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[StoryFormV2] handleSubmit appelé");
    
    // Vérifications supplémentaires avant soumission
    if (isSubmitting) {
      console.log("[StoryFormV2] Soumission déjà en cours, ignoré");
      return;
    }
    
    // Vérification explicite de la sélection d'enfant
    if (!selectedChildrenIds || selectedChildrenIds.length === 0) {
      const errorMsg = "Veuillez sélectionner au moins un enfant pour créer une histoire";
      console.error("[StoryFormV2] Erreur:", errorMsg);
      setFormError(errorMsg);
      
      toast({
        title: "Erreur de validation",
        description: errorMsg,
        variant: "destructive"
      });
      
      return;
    }
    
    // Vérification de l'objectif
    if (!selectedObjective) {
      const errorMsg = "Veuillez sélectionner un objectif pour l'histoire";
      console.error("[StoryFormV2] Erreur:", errorMsg);
      setFormError(errorMsg);
      
      toast({
        title: "Erreur de validation",
        description: errorMsg,
        variant: "destructive"
      });
      
      return;
    }
    
    try {
      // Démarre l'indicateur de chargement et efface les erreurs précédentes
      setIsSubmitting(true);
      setFormError(null);
      
      console.log("[StoryFormV2] Données soumises:", {
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      });
      
      // Appel au service
      const storyId = await onSubmit({
        childrenIds: [...selectedChildrenIds], // Copie explicite pour éviter les problèmes
        objective: selectedObjective
      });
      
      console.log("[StoryFormV2] Histoire créée, ID:", storyId);
      
      // Appeler le callback de succès avec un objet story minimal
      if (storyId && onStoryCreated) {
        onStoryCreated({
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: [...selectedChildrenIds],
          createdAt: new Date(),
          status: 'pending',
          story_text: "",
          story_summary: "",
          objective: selectedObjective
        });
      }
      
      // Réinitialiser le formulaire après succès
      setSelectedChildrenIds([]);
      setSelectedObjective("");
      
      toast({
        title: "Génération lancée",
        description: "Votre histoire est en cours de création"
      });
      
    } catch (error: any) {
      console.error("[StoryFormV2] Erreur pendant la création:", error);
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
  
  // Effet pour effacer l'erreur quand la sélection change
  useEffect(() => {
    if (formError && formError.toLowerCase().includes('enfant') && selectedChildrenIds.length > 0) {
      console.log("[StoryFormV2] Effacement d'erreur suite à sélection d'enfant");
      setFormError(null);
    }
  }, [selectedChildrenIds, formError]);
  
  // Hauteur calculée pour l'aire de défilement
  const scrollAreaHeight = isMobile ? "h-[calc(100vh-250px)]" : "h-[calc(100vh-180px)]";

  return (
    <div className="flex flex-col h-full w-full">
      <ScrollArea className={scrollAreaHeight}>
        <form 
          onSubmit={handleSubmit}
          className="space-y-6 animate-fade-in bg-white dark:bg-muted-dark p-4 sm:p-8 rounded-xl shadow-soft-lg transition-all hover:shadow-xl mx-auto max-w-[95%] sm:max-w-4xl mb-20"
          data-testid="story-form-v2"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Créer une nouvelle histoire</h1>
            <p className="text-muted-foreground">
              Personnalisez une histoire magique pour un moment de lecture unique
            </p>
          </div>
          
          {/* Affichage de l'erreur */}
          {formError && (
            <div className="bg-destructive/10 border border-destructive p-4 rounded-lg text-destructive relative animate-pulse" role="alert">
              <button 
                type="button" 
                className="absolute top-2 right-2 text-destructive" 
                onClick={() => setFormError(null)}
                aria-label="Fermer"
              >
                &times;
              </button>
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{formError}</span>
              </div>
            </div>
          )}
          
          {/* Mode débogage (uniquement en développement) */}
          {debugMode && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg text-xs">
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
                  (total: {selectedChildrenIds.length})
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
          <div className="space-y-4" data-testid="child-selector">
            <div className="text-secondary dark:text-white text-lg font-medium">
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
                      data-child-id={child.id}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          isSelected 
                            ? "bg-primary border-primary text-white" 
                            : "border-gray-300 bg-white"
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
                      
                      {isSelected && (
                        <div className="ml-auto text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-full">
                          ✓ Sélectionné
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center bg-muted/20 rounded-lg">
                <p className="text-muted-foreground">Aucun profil enfant disponible.</p>
              </div>
            )}
            
            <Button
              type="button"
              onClick={handleCreateChildClick}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-4 sm:py-6 border-dashed border-2 hover:border-primary dark:hover:border-primary-dark transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="16" y1="11" x2="22" y2="11"></line>
              </svg>
              {children.length > 0 ? "Ajouter un autre enfant" : "Créer un profil enfant"}
            </Button>
          </div>
          
          {/* Sélecteur d'objectifs */}
          <div className="space-y-4" data-testid="objective-selector">
            <div className="text-secondary dark:text-white text-lg font-medium">
              Je souhaite créer un moment de lecture qui va...
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {objectives.map((objective) => (
                <div
                  key={objective.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border border-muted hover:bg-muted/30 dark:hover:bg-muted-dark/30 transition-colors cursor-pointer ${
                    selectedObjective === objective.value
                      ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                      : "bg-white dark:bg-muted-dark"
                  }`}
                  onClick={() => handleObjectiveSelect(objective.value)}
                  data-testid={`objective-item-${objective.id}`}
                  data-selected={selectedObjective === objective.value ? "true" : "false"}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedObjective === objective.value
                      ? "border-primary bg-primary"
                      : "border-gray-300"
                  }`}>
                    {selectedObjective === objective.value && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  <label
                    className={`text-base font-medium cursor-pointer ${
                      selectedObjective === objective.value && "font-semibold text-primary"
                    }`}
                  >
                    {objective.label}
                  </label>
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

export default StoryFormV2;

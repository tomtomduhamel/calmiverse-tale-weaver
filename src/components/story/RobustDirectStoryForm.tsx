import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import RobustChildSelector from "./form/RobustChildSelector";
import { useRobustChildSelection } from "@/hooks/stories/useRobustChildSelection";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";
import type { Objective } from "@/types/story";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import CreateChildDialog from "./CreateChildDialog";

interface RobustDirectStoryFormProps {
  children: Child[];
  objectives: Objective[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  onStoryCreated: (story: Story) => void;
}

/**
 * Formulaire robuste pour la création directe d'histoires avec mécanismes
 * avancés de validation et de gestion d'état
 */
const RobustDirectStoryForm: React.FC<RobustDirectStoryFormProps> = ({
  children,
  objectives,
  onCreateChild,
  onSubmit,
  onStoryCreated
}) => {
  // État du formulaire avec hooks robustes
  const { 
    selectedChildrenIds, 
    handleChildSelect, 
    getSelectedIds,
    selectedIdsRef,
    forceInitialSelection
  } = useRobustChildSelection([]);
  
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // État pour la création d'enfants
  const [showChildForm, setShowChildForm] = useState(false);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("5");
  
  // Hooks utilitaires
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const isMobile = useIsMobile();
  
  // Référence pour suivre les soumissions et l'état des sélections
  const submissionAttemptRef = useRef(0);
  const domCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const formInitializedRef = useRef(false);
  
  // Force la sélection initiale et la synchronisation DOM au montage
  useEffect(() => {
    console.log("[RobustDirectStoryForm] Montage du composant, initialisation...");
    
    // Attendre que le DOM soit prêt
    const initTimer = setTimeout(() => {
      // Force l'analyse du DOM au démarrage
      forceInitialSelection();
      formInitializedRef.current = true;
      
      console.log("[RobustDirectStoryForm] Formulaire initialisé, sélections récupérées");
    }, 300);
    
    // Mettre en place la détection continue des incohérences DOM
    domCheckTimerRef.current = setInterval(() => {
      // Vérifier si l'état visuel (DOM) correspond à l'état interne
      const selectedDomElements = document.querySelectorAll('[data-selected="true"]');
      const domIds = Array.from(selectedDomElements)
        .map(el => el.getAttribute('data-child-id'))
        .filter(Boolean) as string[];
      
      // Compter les enfants visuellement sélectionnés dans le DOM
      const domSelectedCount = domIds.length;
      
      // Si aucun enfant n'est sélectionné dans le state mais qu'il y en a dans le DOM
      if (selectedChildrenIds.length === 0 && domSelectedCount > 0) {
        console.log("[RobustDirectStoryForm] Détection d'incohérence DOM/State:", {
          selectedChildrenIds,
          domSelectedCount,
          domIds
        });
      }
    }, 1000);
    
    return () => {
      clearTimeout(initTimer);
      if (domCheckTimerRef.current) clearInterval(domCheckTimerRef.current);
    };
  }, [selectedChildrenIds, forceInitialSelection]);
  
  // Gestionnaire pour la sélection d'objectif
  const handleObjectiveSelect = useCallback((objective: string) => {
    console.log("[RobustDirectStoryForm] Sélection d'objectif:", objective);
    setSelectedObjective(objective);
    setFormError(null); // Effacer les erreurs lors de modifications
  }, []);
  
  // Validation robuste du formulaire
  const validateForm = useCallback(() => {
    const currentIds = getSelectedIds();
    
    console.log("[RobustDirectStoryForm] Validation avec:", {
      selectedChildrenIds: currentIds,
      selectedObjective,
      submissionAttempt: submissionAttemptRef.current
    });
    
    if (!currentIds || currentIds.length === 0) {
      return { isValid: false, error: "Veuillez sélectionner au moins un enfant pour créer une histoire" };
    }
    
    if (!selectedObjective) {
      return { isValid: false, error: "Veuillez sélectionner un objectif pour l'histoire" };
    }
    
    return { isValid: true, error: null };
  }, [getSelectedIds, selectedObjective]);
  
  // Gestionnaire de soumission avec mécanismes de sauvegarde
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    submissionAttemptRef.current += 1;
    console.log(`[RobustDirectStoryForm] Tentative de soumission #${submissionAttemptRef.current}`);
    
    if (isSubmitting) {
      console.log("[RobustDirectStoryForm] Soumission déjà en cours, ignorée");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      // Force une nouvelle analyse du DOM avant validation
      forceInitialSelection();
      const currentIds = getSelectedIds();
      
      console.log("[RobustDirectStoryForm] IDs finaux pour soumission:", currentIds);
      
      // Validation avec les IDs actuels
      const validation = validateForm();
      if (!validation.isValid) {
        setFormError(validation.error);
        return;
      }
      
      // Préparer les données pour l'API
      const formData = {
        childrenIds: currentIds,
        objective: selectedObjective
      };
      
      console.log("[RobustDirectStoryForm] Soumission des données:", formData);
      
      // Appeler l'API
      const storyId = await onSubmit(formData);
      
      console.log("[RobustDirectStoryForm] Histoire créée avec succès, ID:", storyId);
      
      // Créer une histoire temporaire pour la navigation
      if (storyId && onStoryCreated) {
        const tempStory: Story = {
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: currentIds,
          createdAt: new Date(),
          status: 'pending',
          content: "", // CORRECTION: utiliser 'content' au lieu de 'story_text'
          story_summary: "",
          objective: selectedObjective
        };
        
        onStoryCreated(tempStory);
      }
      
      // Réinitialiser le formulaire
      setSelectedObjective("");
      
      toast({
        title: "Histoire créée",
        description: "Votre histoire est en cours de génération",
      });
      
    } catch (error: any) {
      console.error("[RobustDirectStoryForm] Erreur lors de la soumission:", error);
      setFormError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
      
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    validateForm,
    selectedObjective,
    onSubmit,
    onStoryCreated,
    forceInitialSelection,
    getSelectedIds,
    toast
  ]);
  
  // Gestionnaire pour la création d'enfant
  const handleCreateChild = useCallback(async () => {
    try {
      const childData = {
        name: childName,
        birthDate: new Date(new Date().getFullYear() - parseInt(childAge), 0, 1),
        authorId: user?.id || "",
        teddyName: "",
        teddyDescription: "",
        imaginaryWorld: "",
        interests: [],
        gender: "unknown" as const
      };
      
      const newChildId = await onCreateChild(childData);
      console.log("[RobustDirectStoryForm] Enfant créé avec ID:", newChildId);
      
      // Réinitialiser le formulaire enfant
      setChildName("");
      setChildAge("5");
      setShowChildForm(false);
      
      toast({
        title: "Enfant ajouté",
        description: "Le profil enfant a été créé avec succès",
      });
      
    } catch (error: any) {
      console.error("[RobustDirectStoryForm] Erreur lors de la création d'enfant:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le profil enfant",
        variant: "destructive",
      });
    }
  }, [childName, childAge, onCreateChild, toast, user?.id]);
  
  // Calculer l'état du bouton
  const isButtonDisabled = isSubmitting || selectedChildrenIds.length === 0 || !selectedObjective;
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6 text-primary">
          Créer une histoire personnalisée
        </h2>
        
        {formError && (
          <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-6 rounded">
            <p className="text-destructive">{formError}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Sélecteur d'enfants robuste */}
          <RobustChildSelector
            children={children}
            selectedChildrenIds={selectedChildrenIds}
            onChildSelect={handleChildSelect}
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowChildForm(true)}
            className="w-full"
          >
            Créer un profil enfant
          </Button>
          
          {/* Sélecteur d'objectifs */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Quel est l'objectif de cette histoire ?</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {objectives.map((objective) => (
                <div
                  key={objective.id}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-colors",
                    selectedObjective === objective.value
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50 border-border"
                  )}
                  onClick={() => handleObjectiveSelect(objective.value)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2",
                      selectedObjective === objective.value
                        ? "bg-primary border-primary"
                        : "border-gray-300"
                    )}>
                      {selectedObjective === objective.value && (
                        <div className="w-full h-full rounded-full bg-primary"></div>
                      )}
                    </div>
                    <span className="font-medium">{objective.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Bouton de soumission */}
          <Button
            type="submit"
            className="w-full py-6 text-lg font-semibold"
            disabled={isButtonDisabled}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                Création en cours...
              </>
            ) : (
              <>
                ✨ Générer l'histoire
              </>
            )}
          </Button>
        </form>
        
        {/* Dialog pour créer un enfant */}
        {showChildForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Créer un profil enfant</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Prénom de l'enfant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Âge</label>
                  <input
                    type="number"
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    min="1"
                    max="18"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    onClick={handleCreateChild}
                    className="flex-1"
                  >
                    Créer
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowChildForm(false)}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RobustDirectStoryForm;

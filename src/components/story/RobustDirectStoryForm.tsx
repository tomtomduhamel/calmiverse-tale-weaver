import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import RobustChildSelector from "./form/RobustChildSelector";
import { useRobustChildSelection } from "@/hooks/stories/useRobustChildSelection";
import { useToast } from "@/hooks/use-toast";
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
  }, [forceInitialSelection, selectedChildrenIds]);
  
  // Journalisation détaillée de l'état du formulaire
  useEffect(() => {
    console.log("[RobustDirectStoryForm] État du formulaire mis à jour:", {
      selectedChildrenIds,
      selectedObjective,
      formError,
      isSubmitting,
      timestamp: new Date().toISOString()
    });
  }, [selectedChildrenIds, selectedObjective, formError, isSubmitting]);
  
  // Validation avec journalisation avancée et récupération DOM
  const validateForm = useCallback(() => {
    // Force la récupération des sélections DOM au moment de la validation
    const selectedDomElements = document.querySelectorAll('[data-selected="true"]');
    const domIds = Array.from(selectedDomElements)
      .map(el => el.getAttribute('data-child-id'))
      .filter(Boolean) as string[];
    
    // Fusion des sources d'IDs pour maximiser la fiabilité
    let actualSelectedIds = [...selectedIdsRef.current];
    
    // Si l'état interne est vide mais que le DOM a des sélections, utiliser le DOM comme source de vérité
    if (actualSelectedIds.length === 0 && domIds.length > 0) {
      console.log("[RobustDirectStoryForm] Récupération d'état depuis le DOM pendant validation", domIds);
      actualSelectedIds = [...domIds];
      
      // Mettre à jour l'état interne avec les sélections DOM
      handleChildSelect(domIds[0]);
    }
    
    console.log("[RobustDirectStoryForm] Validation du formulaire:", {
      enfants: actualSelectedIds,
      enfantsRef: selectedIdsRef.current,
      enfantsDom: domIds,
      objectif: selectedObjective,
      tentative: submissionAttemptRef.current,
      timestamp: new Date().toISOString()
    });
    
    // Vérification des enfants avec priorité sur les sélections DOM
    const effectiveChildrenIds = actualSelectedIds.length > 0 ? actualSelectedIds : domIds;
    
    if (!effectiveChildrenIds || effectiveChildrenIds.length === 0) {
      console.error("[RobustDirectStoryForm] Validation échouée: aucun enfant sélectionné");
      return { isValid: false, error: "Veuillez sélectionner au moins un enfant pour créer une histoire" };
    }
    
    // Vérification de l'objectif
    if (!selectedObjective) {
      console.error("[RobustDirectStoryForm] Validation échouée: aucun objectif sélectionné");
      return { isValid: false, error: "Veuillez sélectionner un objectif pour l'histoire" };
    }
    
    return { isValid: true, error: null, effectiveChildrenIds };
  }, [selectedIdsRef, selectedObjective, handleChildSelect]);
  
  // Gestionnaire d'objectif
  const handleObjectiveChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    console.log("[RobustDirectStoryForm] Objectif sélectionné:", value);
    setSelectedObjective(value);
    
    // Effacer les erreurs liées à l'objectif
    if (formError && formError.toLowerCase().includes('objectif')) {
      setFormError(null);
    }
  }, [formError]);
  
  // Soumission sécurisée avec journalisation détaillée et capture DOM
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Incrémenter le compteur de tentatives
    submissionAttemptRef.current += 1;
    
    console.log("[RobustDirectStoryForm] Soumission du formulaire tentative #", 
      submissionAttemptRef.current, {
        enfantsUI: selectedChildrenIds,
        enfantsRef: selectedIdsRef.current,
        objectif: selectedObjective
      }
    );
    
    if (isSubmitting) {
      console.log("[RobustDirectStoryForm] Soumission déjà en cours, ignorée");
      return;
    }
    
    try {
      // Analyse du DOM pour trouver les enfants sélectionnés visuellement
      const selectedDomElements = document.querySelectorAll('[data-selected="true"]');
      const domSelectedIds = Array.from(selectedDomElements)
        .map(el => el.getAttribute('data-child-id'))
        .filter(Boolean) as string[];
      
      console.log("[RobustDirectStoryForm] Éléments DOM sélectionnés:", {
        count: selectedDomElements.length,
        ids: domSelectedIds
      });
      
      // Dernière vérification pour s'assurer de la cohérence des sélections
      // avec priorité sur les sélections DOM si l'état interne est vide
      const validation = validateForm();
      if (!validation.isValid) {
        setFormError(validation.error);
        toast({
          title: "Erreur",
          description: validation.error || "Veuillez vérifier le formulaire",
          variant: "destructive",
        });
        return;
      }
      
      // Utiliser les IDs effectifs identifiés par validateForm
      const finalSelectedIds = validation.effectiveChildrenIds || 
                              (selectedChildrenIds.length > 0 ? selectedChildrenIds : domSelectedIds);
      
      if (!finalSelectedIds || finalSelectedIds.length === 0) {
        console.error("[RobustDirectStoryForm] Erreur critique: aucun enfant sélectionné après validation");
        setFormError("Veuillez sélectionner au moins un enfant pour créer une histoire");
        return;
      }
      
      console.log("[RobustDirectStoryForm] IDs finaux pour soumission:", finalSelectedIds);
      
      // Début de la soumission
      setIsSubmitting(true);
      setFormError(null);
      
      toast({
        title: "Création en cours",
        description: "Nous préparons votre histoire, veuillez patienter...",
      });
      
      // Appel API avec données cohérentes garanties
      const formData = {
        childrenIds: finalSelectedIds,
        objective: selectedObjective
      };
      
      console.log("[RobustDirectStoryForm] Données soumises:", formData);
      
      const storyId = await onSubmit(formData);
      console.log("[RobustDirectStoryForm] Histoire créée avec ID:", storyId);
      
      toast({
        title: "Histoire en préparation",
        description: "Votre histoire est en cours de génération, vous serez redirigé(e) lorsqu'elle sera prête.",
      });
      
      if (onStoryCreated) {
        onStoryCreated({
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: finalSelectedIds,
          createdAt: new Date(),
          status: 'pending',
          story_text: "",
          story_summary: "",
          objective: selectedObjective
        } as Story);
      }
      
      // Réinitialiser le formulaire
      setSelectedObjective("");
      selectedIdsRef.current = [];
      setFormError(null);
      
      console.log("[RobustDirectStoryForm] Soumission réussie");
      
      return storyId;
    } catch (error: any) {
      console.error("[RobustDirectStoryForm] Erreur lors de la soumission:", error);
      setFormError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
      
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedChildrenIds,
    selectedIdsRef,
    selectedObjective,
    isSubmitting,
    validateForm,
    toast,
    onSubmit,
    onStoryCreated
  ]);
  
  // Gestion de la création d'enfant
  const handleCreateChildClick = useCallback(() => {
    setShowChildForm(true);
  }, []);
  
  // Fonction modifiée pour s'adapter à la nouvelle signature
  const handleAddChild = useCallback(async () => {
    try {
      if (!childName || !childAge) {
        throw new Error("Le nom et l'âge de l'enfant sont requis");
      }
      
      // Calcul de la date de naissance à partir de l'âge
      const today = new Date();
      const birthYear = today.getFullYear() - parseInt(childAge);
      const birthDate = new Date(birthYear, today.getMonth(), today.getDate());
      
      const newChild: Omit<Child, "id"> = {
        name: childName,
        birthDate: birthDate,
        authorId: "current-user", // Sera remplacé par l'API
      };
      
      const childId = await onCreateChild(newChild);
      console.log("[RobustDirectStoryForm] Nouvel enfant créé avec ID:", childId);
      
      // Sélectionner automatiquement le nouvel enfant
      handleChildSelect(childId);
      
      // Réinitialiser le formulaire et le fermer
      setChildName("");
      setChildAge("5");
      setShowChildForm(false);
      
      toast({
        title: "Enfant ajouté",
        description: `${childName} a été ajouté avec succès`,
      });
    } catch (error: any) {
      console.error("[RobustDirectStoryForm] Erreur lors de l'ajout de l'enfant:", error);
      
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de l'ajout de l'enfant",
        variant: "destructive",
      });
    }
  }, [childName, childAge, onCreateChild, handleChildSelect, toast]);
  
  // Calculer si le bouton doit être désactivé
  const isGenerateButtonDisabled = 
    isSubmitting || 
    (selectedChildrenIds.length === 0 && document.querySelectorAll('[data-selected="true"]').length === 0) || 
    !selectedObjective;
  
  return (
    <div className="w-full animate-fade-in">
      <ScrollArea className={isMobile ? "h-[calc(100vh-180px)]" : "h-auto max-h-[800px]"}>
        <form 
          onSubmit={handleSubmit}
          className="space-y-8 bg-card shadow-card rounded-xl p-6 sm:p-8 mx-auto max-w-4xl"
          data-testid="robust-story-form"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Créer une histoire</h1>
            <p className="text-muted-foreground mt-2">
              Personnalisez une histoire magique pour un moment spécial
            </p>
          </div>
          
          {/* Afficher les erreurs */}
          {formError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 animate-pulse">
              <p className="text-destructive font-medium">{formError}</p>
            </div>
          )}
          
          {/* Sélection d'enfant robuste */}
          <RobustChildSelector
            children={children}
            selectedChildrenIds={selectedChildrenIds}
            onChildSelect={handleChildSelect}
            onCreateChildClick={handleCreateChildClick}
            hasError={formError?.toLowerCase().includes('enfant')}
          />
          
          {/* Sélection d'objectif */}
          <div className="space-y-2">
            <div className={cn(
              "text-secondary dark:text-white text-lg font-medium",
              formError?.toLowerCase().includes('objectif') ? "text-destructive" : ""
            )}>
              Quel est l'objectif de cette histoire ?
              {formError?.toLowerCase().includes('objectif') && <span className="ml-2 text-sm text-destructive">*</span>}
            </div>
            
            <select
              value={selectedObjective}
              onChange={handleObjectiveChange}
              className={cn(
                "w-full p-3 rounded-md border bg-white dark:bg-muted font-medium text-secondary",
                formError?.toLowerCase().includes('objectif') ? "border-destructive" : "border-input",
              )}
              data-testid="objective-select"
              disabled={isSubmitting}
            >
              <option value="">Choisir un objectif...</option>
              {objectives.map(objective => (
                <option key={objective.value} value={objective.value}>
                  {objective.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Bouton de soumission */}
          <div className="pt-4">
            <Button
              type="submit"
              className={cn(
                "w-full py-6 text-lg font-semibold transition-all",
                isGenerateButtonDisabled ? "opacity-70" : "hover:shadow-lg"
              )}
              disabled={isGenerateButtonDisabled}
              data-testid="generate-story-button"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Génération en cours...
                </span>
              ) : "Générer l'histoire"}
            </Button>
          </div>
          
          {/* Déboggage - uniquement visible en développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-3 bg-muted/30 rounded-lg text-xs">
              <h4 className="font-bold mb-1 text-muted-foreground">Débogage</h4>
              <pre className="overflow-auto max-h-32 text-muted-foreground/70">
                {JSON.stringify({
                  selectedChildrenIds,
                  selectedIdsRef: selectedIdsRef.current,
                  domSelectedCount: document.querySelectorAll('[data-selected="true"]').length,
                  domSelectedIds: Array.from(document.querySelectorAll('[data-selected="true"]'))
                    .map(el => el.getAttribute('data-child-id')),
                  selectedObjective,
                  formError,
                  isSubmitting,
                  submissionAttempts: submissionAttemptRef.current
                }, null, 2)}
              </pre>
            </div>
          )}
        </form>
      </ScrollArea>
      
      {/* Dialog pour création d'enfant */}
      <CreateChildDialog
        open={showChildForm}
        onOpenChange={setShowChildForm}
        childName={childName}
        childAge={childAge}
        onSubmit={handleAddChild}
        onReset={() => {
          setChildName("");
          setChildAge("5");
        }}
        onChildNameChange={setChildName}
        onChildAgeChange={setChildAge}
      />
    </div>
  );
};

export default RobustDirectStoryForm;

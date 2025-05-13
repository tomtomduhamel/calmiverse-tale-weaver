
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { calculateAge } from "@/utils/age";
import CreateChildDialog from "./CreateChildDialog";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";

interface UnifiedStoryCreatorProps {
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onStoryCreated: (story: Story) => void;
}

/**
 * Composant unifié pour la création d'histoires avec une gestion d'état robuste
 * et un mécanisme de synchronisation entre l'état React et le DOM
 */
const UnifiedStoryCreator: React.FC<UnifiedStoryCreatorProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  // Source unique de vérité pour l'état
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  
  // État du formulaire d'ajout d'enfant
  const [showChildForm, setShowChildForm] = useState<boolean>(false);
  const [childName, setChildName] = useState<string>("");
  const [childAge, setChildAge] = useState<string>("5");
  
  // Référence pour suivre les enfants sélectionnés visuellement dans le DOM
  const domSelectionsRef = useRef<Set<string>>(new Set());
  
  // Statistiques et journalisation
  const [syncCount, setSyncCount] = useState<number>(0);
  const [debugLogs, setDebugLogs] = useState<Array<{time: string, message: string, data?: any}>>([]);
  
  // Hooks externes
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Fonction de journalisation améliorée
  const logDebug = useCallback((message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`[UnifiedStoryCreator] ${timestamp} ${message}`, data || '');
    
    setDebugLogs(prev => [
      { time: timestamp, message, data },
      ...prev.slice(0, 19) // Garder uniquement les 20 derniers logs
    ]);
  }, []);
  
  // Effectuer la sélection automatique du premier enfant au chargement
  useEffect(() => {
    if (children.length > 0 && selectedChildrenIds.length === 0) {
      logDebug("Sélection automatique du premier enfant", { childId: children[0].id });
      setSelectedChildrenIds([children[0].id]);
    }
  }, [children, selectedChildrenIds.length, logDebug]);
  
  // Mécanisme de synchronisation État → DOM
  useEffect(() => {
    const syncStateToDom = () => {
      // Mettre à jour le DOM avec l'état React actuel
      children.forEach(child => {
        const domElement = document.querySelector(`[data-child-id="${child.id}"]`);
        if (domElement) {
          const isSelected = selectedChildrenIds.includes(child.id);
          domElement.setAttribute('data-selected', isSelected ? 'true' : 'false');
          
          // Mettre à jour les classes CSS pour refléter l'état
          if (isSelected) {
            domElement.classList.add('bg-primary/10');
            domElement.classList.remove('hover:bg-muted/50');
          } else {
            domElement.classList.remove('bg-primary/10');
            domElement.classList.add('hover:bg-muted/50');
          }
        }
      });
      
      logDebug("État synchronisé vers le DOM", { selectedChildrenIds });
    };
    
    syncStateToDom();
    const intervalId = setInterval(syncStateToDom, 500); // Synchronisation périodique
    
    return () => clearInterval(intervalId);
  }, [selectedChildrenIds, children, logDebug]);
  
  // Mécanisme de synchronisation DOM → État
  useEffect(() => {
    const syncDomToState = () => {
      const selectedDomElements = document.querySelectorAll('[data-selected="true"]');
      const domSelectedIds = Array.from(selectedDomElements)
        .map(el => el.getAttribute('data-child-id'))
        .filter((id): id is string => id !== null);
      
      // Mettre à jour la référence DOM
      domSelectionsRef.current = new Set(domSelectedIds);
      
      // Si le DOM a des sélections mais l'état est vide, synchroniser
      if (domSelectedIds.length > 0 && selectedChildrenIds.length === 0) {
        logDebug("Récupération des sélections depuis le DOM", { domSelectedIds });
        setSelectedChildrenIds(domSelectedIds);
        setSyncCount(prev => prev + 1);
      }
      
      // Détecter les incohérences
      const stateSet = new Set(selectedChildrenIds);
      const isDifferent = domSelectedIds.length !== selectedChildrenIds.length || 
                         domSelectedIds.some(id => !stateSet.has(id));
      
      if (isDifferent && domSelectedIds.length > 0) {
        logDebug("Incohérence détectée entre DOM et état", { 
          domIds: domSelectedIds, 
          stateIds: selectedChildrenIds 
        });
        
        // Résoudre l'incohérence en faveur du DOM (ce que voit l'utilisateur)
        setSelectedChildrenIds(domSelectedIds);
        setSyncCount(prev => prev + 1);
      }
    };
    
    const intervalId = setInterval(syncDomToState, 1000);
    return () => clearInterval(intervalId);
  }, [selectedChildrenIds, logDebug]);
  
  // Sélection d'enfant avec mises à jour DOM immédiates
  const handleChildSelect = useCallback((childId: string) => {
    if (!childId) return;
    
    logDebug("Clic de sélection d'enfant", { childId });
    
    setSelectedChildrenIds(prev => {
      const isSelected = prev.includes(childId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== childId) 
        : [...prev, childId];
      
      // Mise à jour immédiate du DOM pour un feedback instantané
      const domElement = document.querySelector(`[data-child-id="${childId}"]`);
      if (domElement) {
        domElement.setAttribute('data-selected', (!isSelected).toString());
      }
      
      logDebug("Nouvelle sélection", { newSelection });
      return newSelection;
    });
    
    // Effacer les erreurs liées aux enfants
    if (formError && formError.toLowerCase().includes('enfant')) {
      setFormError(null);
    }
  }, [formError, logDebug]);
  
  // Gestion de la sélection d'objectif
  const handleObjectiveSelect = useCallback((objective: string) => {
    logDebug("Objectif sélectionné", { objective });
    setSelectedObjective(objective);
    
    // Effacer les erreurs liées aux objectifs
    if (formError && formError.toLowerCase().includes('objectif')) {
      setFormError(null);
    }
  }, [formError, logDebug]);
  
  // Validation robuste en deux étapes
  const validateForm = useCallback(() => {
    logDebug("Validation du formulaire", { 
      selectedChildrenIds,
      domSelections: Array.from(domSelectionsRef.current),
      selectedObjective 
    });
    
    // Étape 1: Vérifier l'état React
    if (selectedChildrenIds.length === 0) {
      // Étape 1.5: Si l'état est vide, vérifier le DOM comme fallback
      const domSelectedIds = Array.from(domSelectionsRef.current);
      
      if (domSelectedIds.length > 0) {
        // Récupérer les sélections du DOM et mettre à jour l'état
        logDebug("Récupération d'urgence des sélections DOM", { domSelectedIds });
        setSelectedChildrenIds(domSelectedIds);
        
        // Continuer la validation avec ces valeurs
        if (!selectedObjective) {
          return { isValid: false, error: "Veuillez sélectionner un objectif pour l'histoire" };
        }
        return { isValid: true, error: null };
      }
      
      return { isValid: false, error: "Veuillez sélectionner au moins un enfant pour créer une histoire" };
    }
    
    if (!selectedObjective) {
      return { isValid: false, error: "Veuillez sélectionner un objectif pour l'histoire" };
    }
    
    return { isValid: true, error: null };
  }, [selectedChildrenIds, selectedObjective, logDebug]);
  
  // Gestion de la soumission avec mécanisme de récupération
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    logDebug("Tentative de soumission du formulaire");
    
    if (isSubmitting) {
      logDebug("Soumission déjà en cours, ignorée");
      return;
    }
    
    try {
      // Validation finale
      const validation = validateForm();
      if (!validation.isValid) {
        setFormError(validation.error);
        toast({
          title: "Erreur de validation",
          description: validation.error || "Veuillez vérifier le formulaire",
          variant: "destructive",
        });
        return;
      }
      
      // Démarrer la soumission
      setIsSubmitting(true);
      setFormError(null);
      
      // Animation de progression
      let progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 10;
        });
      }, 500);
      
      // Capture finale des données à soumettre
      // On utilise une combinaison des sélections React et DOM pour une fiabilité maximale
      const finalChildrenIds = selectedChildrenIds.length > 0 
        ? selectedChildrenIds 
        : Array.from(domSelectionsRef.current);
      
      logDebug("Soumission du formulaire", {
        childrenIds: finalChildrenIds,
        objective: selectedObjective
      });
      
      toast({
        title: "Création en cours",
        description: "Nous préparons votre histoire, veuillez patienter...",
      });
      
      // Appel API
      const storyId = await onSubmit({
        childrenIds: finalChildrenIds,
        objective: selectedObjective
      });
      
      clearInterval(progressTimer);
      setProgress(100);
      
      logDebug("Histoire créée avec succès", { storyId });
      
      // Créer l'objet Story temporaire
      const tempStory: Story = {
        id: storyId,
        title: "Histoire en cours de génération",
        preview: "Génération en cours...",
        childrenIds: finalChildrenIds,
        createdAt: new Date(),
        status: 'pending',
        story_text: "",
        story_summary: "",
        objective: selectedObjective
      };
      
      // Notifier le parent
      onStoryCreated(tempStory);
      
      // Réinitialiser le formulaire
      setSelectedChildrenIds([]);
      setSelectedObjective("");
      setFormError(null);
      
      toast({
        title: "Histoire créée",
        description: "Votre histoire est en cours de génération.",
      });
    } catch (error: any) {
      logDebug("Erreur lors de la soumission", { error: error.message });
      
      setFormError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la création de l'histoire",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setProgress(0);
    }
  }, [isSubmitting, validateForm, selectedChildrenIds, selectedObjective, onSubmit, onStoryCreated, toast, logDebug]);
  
  // Création d'enfant
  const handleChildFormOpen = useCallback(() => {
    logDebug("Ouverture du formulaire d'ajout d'enfant");
    setShowChildForm(true);
  }, [logDebug]);
  
  const resetChildForm = useCallback(() => {
    logDebug("Réinitialisation du formulaire d'enfant");
    setChildName("");
    setChildAge("5");
  }, [logDebug]);
  
  const handleChildFormSubmit = useCallback(async () => {
    try {
      logDebug("Soumission du formulaire d'enfant", { childName, childAge });
      
      if (!childName || !childAge) {
        throw new Error("Le nom et l'âge de l'enfant sont requis");
      }
      
      // Calculer la date de naissance
      const now = new Date();
      const birthYear = now.getFullYear() - parseInt(childAge);
      const birthDate = new Date(birthYear, now.getMonth(), now.getDate());
      
      // Créer l'enfant
      const childId = await onCreateChild({
        name: childName,
        birthDate,
        gender: 'unknown',
        authorId: '',
        interests: []
      });
      
      logDebug("Enfant créé avec succès", { childId });
      
      // Sélectionner automatiquement le nouvel enfant
      setSelectedChildrenIds(prev => [...prev, childId]);
      
      // Fermer et réinitialiser le formulaire
      setShowChildForm(false);
      resetChildForm();
      
      toast({
        title: "Enfant ajouté",
        description: `${childName} a été ajouté avec succès.`,
      });
    } catch (error: any) {
      logDebug("Erreur lors de la création d'enfant", { error: error.message });
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création de l'enfant",
        variant: "destructive",
      });
    }
  }, [childName, childAge, onCreateChild, resetChildForm, toast, logDebug]);
  
  // État désactivé du bouton
  const isGenerateButtonDisabled = useMemo(() => {
    const isDisabled = isSubmitting || 
      (selectedChildrenIds.length === 0 && domSelectionsRef.current.size === 0) || 
      !selectedObjective;
    
    return isDisabled;
  }, [isSubmitting, selectedChildrenIds, selectedObjective]);
  
  // Affichage des états de chargement
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
  
  // Objectifs par défaut si nécessaire
  const objectivesToUse = objectives?.length > 0 
    ? objectives 
    : [
        { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
        { id: "focus", label: "Se concentrer", value: "focus" },
        { id: "relax", label: "Se relaxer", value: "relax" },
        { id: "fun", label: "S'amuser", value: "fun" },
      ];
  
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <ScrollArea className={isMobile ? "h-[calc(100vh-180px)]" : "h-auto max-h-[800px]"}>
        <form 
          onSubmit={handleSubmit}
          className="space-y-8 bg-card shadow-md rounded-xl p-6 sm:p-8"
          data-testid="unified-story-form"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Créer une histoire</h1>
            <p className="text-muted-foreground mt-2">
              Personnalisez une histoire magique pour un moment unique
            </p>
          </div>
          
          {/* Debug panel in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-2 rounded text-xs">
              <summary className="font-bold cursor-pointer">Debug Info ({syncCount} syncs)</summary>
              <div className="mt-2 space-y-1 text-xs">
                <p>État: {JSON.stringify(selectedChildrenIds)}</p>
                <p>DOM: {JSON.stringify(Array.from(domSelectionsRef.current))}</p>
                <p>Objectif: {selectedObjective}</p>
                <p>Synchronisations: {syncCount}</p>
                <div className="max-h-32 overflow-y-auto mt-2">
                  {debugLogs.map((log, i) => (
                    <div key={i} className="font-mono text-xs mt-1">
                      <span className="opacity-70">{log.time}</span> {log.message}
                      {log.data && <span className="block pl-5 opacity-70">{JSON.stringify(log.data)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          )}
          
          {/* Error display with animation for attention */}
          {formError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 animate-pulse">
              <p className="text-destructive font-medium">{formError}</p>
            </div>
          )}
          
          {/* Child selection */}
          <div className="space-y-4" data-testid="child-selector">
            <div className={cn(
              "text-secondary dark:text-white text-lg font-medium",
              formError?.toLowerCase().includes('enfant') ? "text-destructive" : ""
            )}>
              Pour qui est cette histoire ?
              {formError?.toLowerCase().includes('enfant') && <span className="ml-2 text-sm text-destructive">*</span>}
            </div>
            
            {children.length > 0 ? (
              <div className={cn(
                "space-y-2",
                formError?.toLowerCase().includes('enfant') ? "border-2 border-destructive/20 p-2 rounded-lg" : ""
              )}>
                {children.map((child) => {
                  const isSelected = selectedChildrenIds.includes(child.id);
                  
                  return (
                    <div
                      key={child.id}
                      onClick={() => handleChildSelect(child.id)}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg transition-all cursor-pointer",
                        isSelected
                          ? "bg-primary/10 hover:bg-primary/20" 
                          : "hover:bg-muted/50 dark:hover:bg-muted-dark/50"
                      )}
                      data-testid={`child-item-${child.id}`}
                      data-selected={isSelected ? "true" : "false"}
                      data-child-id={child.id}
                    >
                      <div className="flex-shrink-0">
                        <div className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center",
                          isSelected 
                            ? "bg-primary border-primary text-white" 
                            : "border-gray-300 bg-white"
                        )}>
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
                      
                      <div className={cn(
                        "text-base font-medium leading-none",
                        isSelected ? "font-semibold text-primary" : ""
                      )}>
                        {child.name} ({calculateAge(child.birthDate)} ans)
                      </div>
                      
                      {/* Badge de sélection - visible si sélectionné */}
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
              onClick={handleChildFormOpen}
              variant="outline"
              className={cn(
                "w-full flex items-center justify-center gap-2 py-4 sm:py-6 border-dashed border-2 hover:border-primary dark:hover:border-primary-dark transition-colors",
                formError?.toLowerCase().includes('enfant') ? "border-destructive/50 hover:border-destructive" : ""
              )}
            >
              <UserPlus className="w-5 h-5" />
              {children.length > 0 ? "Ajouter un autre enfant" : "Créer un profil enfant"}
            </Button>
          </div>
          
          {/* Objective selection */}
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
              onChange={(e) => handleObjectiveSelect(e.target.value)}
              className={cn(
                "w-full p-3 rounded-md border bg-white dark:bg-muted font-medium text-secondary",
                formError?.toLowerCase().includes('objectif') ? "border-destructive" : "border-input",
              )}
              data-testid="objective-select"
              disabled={isSubmitting}
            >
              <option value="">Choisir un objectif...</option>
              {objectivesToUse.map(objective => (
                <option key={objective.value} value={objective.value}>
                  {objective.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Submit button with progress */}
          <div className="pt-4">
            <div className="relative">
              <Button
                type="submit"
                className="w-full py-6 text-lg font-semibold transition-all"
                disabled={isGenerateButtonDisabled}
                data-testid="generate-story-button"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Génération en cours...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5" />
                    Générer l'histoire
                  </span>
                )}
              </Button>
              
              {/* Progress bar overlay */}
              {isSubmitting && (
                <div className="absolute left-0 bottom-0 h-1 bg-primary/50 transition-all duration-300 rounded-full"
                     style={{ width: `${progress}%` }}>
                </div>
              )}
            </div>
          </div>
        </form>
      </ScrollArea>
      
      {/* Child creation dialog */}
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

export default UnifiedStoryCreator;

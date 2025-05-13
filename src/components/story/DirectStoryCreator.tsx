
import React, { useState, useEffect } from "react";
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
import type { Objective } from "@/types/story";

interface DirectStoryCreatorProps {
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onStoryCreated: (story: Story) => void;
}

/**
 * Composant unifié pour la création d'histoires avec une gestion d'état simplifiée
 * Cette approche élimine les problèmes de synchronisation entre différentes couches
 */
const DirectStoryCreator: React.FC<DirectStoryCreatorProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  // État simple et direct
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showChildForm, setShowChildForm] = useState(false);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("5");
  
  // Charger les objectifs pour les histoires
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Objectifs par défaut si le chargement échoue
  const defaultObjectives = [
    { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
    { id: "focus", label: "Se concentrer", value: "focus" },
    { id: "relax", label: "Se relaxer", value: "relax" },
    { id: "fun", label: "S'amuser", value: "fun" },
  ];
  
  // Si aucun enfant n'est sélectionné mais que des enfants existent, sélectionner le premier automatiquement
  useEffect(() => {
    if (selectedChildrenIds.length === 0 && children.length > 0) {
      console.log("DirectStoryCreator: Sélection automatique du premier enfant");
      setSelectedChildrenIds([children[0].id]);
    }
  }, [children, selectedChildrenIds]);
  
  // Mettre à jour les attributs DOM pour refléter la sélection
  useEffect(() => {
    // Synchroniser le DOM avec l'état React
    children.forEach(child => {
      const domElement = document.querySelector(`[data-child-id="${child.id}"]`);
      if (domElement) {
        const isSelected = selectedChildrenIds.includes(child.id);
        domElement.setAttribute('data-selected', isSelected ? 'true' : 'false');
      }
    });
  }, [children, selectedChildrenIds]);
  
  // Capturer l'état du DOM pour garantir la cohérence
  useEffect(() => {
    const syncTimer = setInterval(() => {
      const selectedDomElements = document.querySelectorAll('[data-selected="true"]');
      const domIds = Array.from(selectedDomElements)
        .map(el => el.getAttribute('data-child-id'))
        .filter(Boolean) as string[];
      
      // Si des éléments sont sélectionnés visuellement mais pas dans l'état
      if (domIds.length > 0 && selectedChildrenIds.length === 0) {
        console.log("DirectStoryCreator: Récupération de sélection depuis le DOM", domIds);
        setSelectedChildrenIds(domIds);
      }
    }, 500);
    
    return () => clearInterval(syncTimer);
  }, [selectedChildrenIds]);
  
  // Fonction de journalisation pour le débogage
  const logState = (action: string, data?: any) => {
    console.log(`[DirectStoryCreator][${action}]`, {
      selectedChildrenIds,
      selectedObjective,
      domSelected: Array.from(document.querySelectorAll('[data-selected="true"]'))
        .map(el => el.getAttribute('data-child-id')),
      ...data
    });
  };
  
  // Sélection d'enfant simplifiée
  const handleChildSelect = (childId: string) => {
    logState("handleChildSelect", { childId });
    
    setSelectedChildrenIds(prev => {
      const isSelected = prev.includes(childId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== childId) 
        : [...prev, childId];
      
      // Mise à jour immédiate du DOM
      const domElement = document.querySelector(`[data-child-id="${childId}"]`);
      if (domElement) {
        domElement.setAttribute('data-selected', (!isSelected).toString());
      }
      
      return newSelection;
    });
    
    // Supprimer les erreurs liées aux enfants
    if (formError?.toLowerCase().includes("enfant")) {
      setFormError(null);
    }
  };
  
  // Sélection d'objectif simplifiée
  const handleObjectiveChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    logState("handleObjectiveChange", { value });
    setSelectedObjective(value);
    
    // Supprimer les erreurs liées à l'objectif
    if (formError?.toLowerCase().includes("objectif")) {
      setFormError(null);
    }
  };
  
  // Fonction de validation améliorée qui utilise également l'état du DOM
  const validateForm = () => {
    // Vérifier l'état React
    let effectiveChildrenIds = [...selectedChildrenIds];
    
    // Vérifier également le DOM comme source de vérité additionnelle
    const selectedDomElements = document.querySelectorAll('[data-selected="true"]');
    const domIds = Array.from(selectedDomElements)
      .map(el => el.getAttribute('data-child-id'))
      .filter(Boolean) as string[];
    
    // Si l'état React est vide mais que des éléments sont sélectionnés visuellement
    if (effectiveChildrenIds.length === 0 && domIds.length > 0) {
      effectiveChildrenIds = domIds;
      logState("validateForm - récupération DOM", { domIds, effectiveChildrenIds });
    }
    
    if (effectiveChildrenIds.length === 0) {
      return { isValid: false, error: "Veuillez sélectionner au moins un enfant pour créer une histoire" };
    }
    
    if (!selectedObjective) {
      return { isValid: false, error: "Veuillez sélectionner un objectif pour l'histoire" };
    }
    
    return { isValid: true, error: null, effectiveChildrenIds };
  };
  
  // Soumission du formulaire avec sauvegarde DOM
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logState("handleSubmit - début");
    
    if (isSubmitting) {
      return;
    }
    
    try {
      // Validation renforcée
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
      
      // Utiliser les IDs effectifs (React ou DOM)
      const finalChildrenIds = validation.effectiveChildrenIds || selectedChildrenIds;
      
      if (!finalChildrenIds || finalChildrenIds.length === 0) {
        setFormError("Veuillez sélectionner au moins un enfant pour créer une histoire");
        return;
      }
      
      // Début de soumission
      setIsSubmitting(true);
      setFormError(null);
      
      toast({
        title: "Création en cours",
        description: "Nous préparons votre histoire, veuillez patienter...",
      });
      
      // Soumission des données
      const formData = {
        childrenIds: finalChildrenIds,
        objective: selectedObjective
      };
      
      logState("handleSubmit - appel API", formData);
      
      const storyId = await onSubmit(formData);
      
      toast({
        title: "Histoire en préparation",
        description: "Votre histoire est en cours de génération.",
      });
      
      if (onStoryCreated) {
        onStoryCreated({
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: finalChildrenIds,
          createdAt: new Date(),
          status: 'pending',
          story_text: "",
          story_summary: "",
          objective: selectedObjective
        } as Story);
      }
      
      // Réinitialiser le formulaire
      setSelectedChildrenIds([]);
      setSelectedObjective("");
      setFormError(null);
      
      logState("handleSubmit - succès", { storyId });
      
      return storyId;
    } catch (error: any) {
      console.error("DirectStoryCreator: Erreur lors de la soumission:", error);
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
  };
  
  // Gestion de la création d'enfant
  const handleCreateChildClick = () => {
    setShowChildForm(true);
  };
  
  const handleAddChild = async () => {
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
      console.log("DirectStoryCreator: Nouvel enfant créé avec ID:", childId);
      
      // Sélectionner automatiquement le nouvel enfant
      setSelectedChildrenIds([childId]);
      
      // Réinitialiser le formulaire et le fermer
      setChildName("");
      setChildAge("5");
      setShowChildForm(false);
      
      toast({
        title: "Enfant ajouté",
        description: `${childName} a été ajouté avec succès`,
      });
    } catch (error: any) {
      console.error("DirectStoryCreator: Erreur lors de l'ajout de l'enfant:", error);
      
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de l'ajout de l'enfant",
        variant: "destructive",
      });
    }
  };
  
  // Gérer l'état de chargement
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
  
  // Les objectifs à utiliser
  const objectivesToUse = objectives?.length > 0 ? objectives : defaultObjectives;
  
  return (
    <div className="w-full animate-fade-in">
      <ScrollArea className={isMobile ? "h-[calc(100vh-180px)]" : "h-auto max-h-[800px]"}>
        <form 
          onSubmit={handleSubmit}
          className="space-y-8 bg-card shadow-card rounded-xl p-6 sm:p-8 mx-auto max-w-4xl"
          data-testid="story-form"
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
          
          {/* Sélection d'enfant simplifiée */}
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
              onClick={handleCreateChildClick}
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
              {objectivesToUse.map(objective => (
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
              className="w-full py-6 text-lg font-semibold transition-all"
              disabled={isSubmitting || (selectedChildrenIds.length === 0 && document.querySelectorAll('[data-selected="true"]').length === 0) || !selectedObjective}
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
          </div>
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

export default DirectStoryCreator;

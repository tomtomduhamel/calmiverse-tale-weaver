
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import CreateChildDialog from "./CreateChildDialog";
import type { Child } from "@/types/child";
import type { Objective, Story } from "@/types/story";

interface DirectStoryFormProps {
  children: Child[];
  objectives: Objective[];
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  onStoryCreated: (story: Story) => void;
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
}

/**
 * Formulaire simplifié pour la création d'histoire avec gestion d'état directe
 * Cette version évite les problèmes de synchronisation en gérant tout l'état localement
 */
const DirectStoryForm: React.FC<DirectStoryFormProps> = ({
  children,
  objectives,
  onSubmit,
  onStoryCreated,
  onCreateChild
}) => {
  // État local direct
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showChildForm, setShowChildForm] = useState(false);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("1");
  
  // État de débogage
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const addLog = (message: string) => {
    console.log(`[DirectStoryForm] ${message}`);
    setDebugLog(prev => [...prev, `${new Date().toISOString().split('T')[1]}: ${message}`]);
  };
  
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Journalisation à chaque rendu
  useEffect(() => {
    addLog(`Rendu avec ${selectedChildrenIds.length} enfant(s) sélectionné(s), objectif: ${selectedObjective || "aucun"}`);
  }, [selectedChildrenIds, selectedObjective]);
  
  // Effacer les erreurs quand les sélections changent
  useEffect(() => {
    if (formError) {
      if ((formError.toLowerCase().includes('enfant') && selectedChildrenIds.length > 0) ||
          (formError.toLowerCase().includes('objectif') && selectedObjective)) {
        setFormError(null);
        addLog("Erreur effacée car les sélections ont changé");
      }
    }
  }, [selectedChildrenIds, selectedObjective, formError]);

  // Gestion de la sélection d'enfants
  const handleChildSelect = (childId: string) => {
    if (!childId) {
      addLog("Erreur: ID d'enfant non valide");
      return;
    }
    
    addLog(`Changement de sélection pour l'enfant ${childId}`);
    
    setSelectedChildrenIds(prev => {
      const isSelected = prev.includes(childId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== childId) 
        : [...prev, childId];
      
      addLog(`Nouvelle sélection: [${newSelection.join(", ")}]`);
      return newSelection;
    });
  };
  
  // Gestion de la sélection d'objectif
  const handleObjectiveSelect = (objective: string) => {
    addLog(`Objectif sélectionné: ${objective}`);
    setSelectedObjective(objective);
  };
  
  // Gestion de l'ouverture du formulaire d'enfant
  const handleCreateChildClick = () => {
    addLog("Ouverture du formulaire de création d'enfant");
    setShowChildForm(true);
  };
  
  // Gestion de la soumission du formulaire d'enfant
  const handleChildFormSubmit = async () => {
    if (!childName.trim()) {
      addLog("Erreur: Nom d'enfant vide");
      return;
    }
    
    try {
      addLog(`Création d'un enfant: ${childName}, ${childAge} an(s)`);
      
      // Calculer la date de naissance
      const now = new Date();
      const birthYear = now.getFullYear() - parseInt(childAge);
      const birthDate = new Date(birthYear, now.getMonth(), now.getDate()).toISOString();
      
      // Créer l'enfant avec le minimum de données
      const childId = await onCreateChild({
        name: childName,
        birthDate: birthDate as any,
        interests: [],
        gender: 'unknown',
        authorId: ''
      });
      
      addLog(`Enfant créé avec l'ID: ${childId}`);
      setShowChildForm(false);
      
      // Sélectionner automatiquement le nouvel enfant
      setSelectedChildrenIds(prev => [...prev, childId]);
      
      // Réinitialiser le formulaire
      setChildName("");
      setChildAge("1");
      
      toast({
        title: "Enfant créé",
        description: `Le profil de ${childName} a été créé avec succès.`
      });
    } catch (error: any) {
      addLog(`Erreur lors de la création: ${error.message}`);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création du profil.",
        variant: "destructive"
      });
    }
  };
  
  // Validation directe du formulaire
  const validateForm = () => {
    // Vérification explicite et détaillée
    if (!selectedChildrenIds || selectedChildrenIds.length === 0) {
      addLog("Validation échouée: Aucun enfant sélectionné");
      setFormError("Veuillez sélectionner au moins un enfant pour créer une histoire");
      return false;
    }
    
    if (!selectedObjective) {
      addLog("Validation échouée: Aucun objectif sélectionné");
      setFormError("Veuillez sélectionner un objectif pour l'histoire");
      return false;
    }
    
    addLog("Validation du formulaire réussie");
    return true;
  };
  
  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addLog("Soumission du formulaire initiée");
    
    // Vérification de soumission déjà en cours
    if (isSubmitting) {
      addLog("Soumission déjà en cours, ignorée");
      return;
    }
    
    // Journalisation de l'état avant validation
    addLog(`État avant validation: enfants=${JSON.stringify(selectedChildrenIds)}, objectif=${selectedObjective}`);
    
    // Validation précise et explicite
    if (!validateForm()) {
      return;
    }
    
    try {
      // Activer l'état de chargement
      setIsSubmitting(true);
      setFormError(null);
      
      addLog(`Appel API avec: enfants=[${selectedChildrenIds.join(", ")}], objectif=${selectedObjective}`);
      
      // Notification immédiate
      toast({
        title: "Création en cours",
        description: "Votre histoire est en cours de création..."
      });
      
      // Double vérification des données envoyées
      const dataToSubmit = {
        childrenIds: [...selectedChildrenIds], // Copie pour éviter les mutations
        objective: selectedObjective
      };
      
      addLog(`Données finales envoyées: ${JSON.stringify(dataToSubmit)}`);
      
      // Appel API avec trace d'erreur explicite
      let storyId;
      try {
        storyId = await onSubmit(dataToSubmit);
        addLog(`Réponse API reçue: ID=${storyId}`);
      } catch (apiError: any) {
        addLog(`Erreur API: ${apiError.message || "Erreur inconnue"}`);
        throw apiError;
      }
      
      if (!storyId) {
        throw new Error("Aucun ID d'histoire n'a été retourné par l'API");
      }
      
      // Création d'une histoire temporaire 
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
      
      addLog(`Appel du callback onStoryCreated avec: ${JSON.stringify(tempStory)}`);
      onStoryCreated(tempStory);
      
      // Réinitialisation du formulaire après succès
      setSelectedChildrenIds([]);
      setSelectedObjective("");
      
      toast({
        title: "Création réussie",
        description: "Votre histoire est en cours de génération."
      });
      
    } catch (error: any) {
      addLog(`Erreur lors de la soumission: ${error.message || "Erreur inconnue"}`);
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
  
  // État désactivé du bouton
  const isButtonDisabled = isSubmitting || selectedChildrenIds.length === 0 || !selectedObjective;
  
  // Hauteur calculée pour l'aire de défilement
  const scrollAreaHeight = isMobile ? "h-[calc(100vh-250px)]" : "h-[calc(100vh-180px)]";
  
  return (
    <div className="flex flex-col h-full w-full">
      <ScrollArea className={scrollAreaHeight}>
        <form
          onSubmit={handleSubmit}
          className="space-y-6 animate-fade-in bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg mx-auto max-w-[95%] sm:max-w-4xl mb-20"
          data-testid="direct-story-form"
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
          {process.env.NODE_ENV === "development" && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg text-xs">
              <div className="flex justify-between items-center">
                <h3 className="font-bold">Mode débogage</h3>
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
                <details className="mt-2">
                  <summary className="cursor-pointer">Journal de débogage ({debugLog.length})</summary>
                  <div className="mt-1 max-h-28 overflow-y-auto text-xs bg-white dark:bg-gray-700 p-1 rounded">
                    {debugLog.map((log, i) => (
                      <div key={i} className="font-mono">{log}</div>
                    ))}
                  </div>
                </details>
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
            
            <Button
              type="button"
              onClick={handleCreateChildClick}
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
      
      {/* Dialogue de création d'enfant */}
      {showChildForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Créer un profil enfant</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input 
                  type="text" 
                  value={childName} 
                  onChange={(e) => setChildName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Prénom de l'enfant"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Âge</label>
                <select 
                  value={childAge} 
                  onChange={(e) => setChildAge(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {[...Array(18)].map((_, i) => (
                    <option key={i} value={i+1}>{i+1} an{i > 0 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowChildForm(false)}>
                Annuler
              </Button>
              <Button onClick={handleChildFormSubmit}>
                Créer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectStoryForm;

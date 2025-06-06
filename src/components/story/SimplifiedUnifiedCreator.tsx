
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";

interface SimplifiedUnifiedCreatorProps {
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>;
  children: Child[];
  onCreateChild: (child: Omit<Child, "id">) => Promise<string>;
  onStoryCreated: (story: Story) => void;
}

/**
 * Version simplifiée et directe du créateur d'histoire
 * Approche radicale pour contourner les problèmes de validation complexes
 */
const SimplifiedUnifiedCreator: React.FC<SimplifiedUnifiedCreatorProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  // États simples et directs
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Chargement des objectifs
  const { objectives, isLoading: loadingObjectives } = useStoryObjectives();
  const { toast } = useToast();
  
  // Objectifs par défaut en cas d'échec
  const defaultObjectives = [
    { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
    { id: "focus", label: "Se concentrer", value: "focus" },
    { id: "relax", label: "Se relaxer", value: "relax" },
    { id: "fun", label: "S'amuser", value: "fun" },
  ];
  
  const activeObjectives = objectives || defaultObjectives;

  // Sélectionner automatiquement le premier enfant et objectif au chargement
  useEffect(() => {
    console.log("[SimplifiedUnifiedCreator] Initialisation avec", {
      childrenCount: children?.length || 0,
      objectivesCount: activeObjectives?.length || 0,
    });
    
    // Sélectionner automatiquement le premier enfant s'il y en a un
    if (children && children.length > 0 && selectedChildIds.length === 0) {
      const firstChildId = children[0].id;
      console.log("[SimplifiedUnifiedCreator] Sélection automatique du premier enfant:", firstChildId);
      setSelectedChildIds([firstChildId]);
    }
    
    // Sélectionner automatiquement le premier objectif
    if (activeObjectives && activeObjectives.length > 0 && !selectedObjective) {
      const firstObjective = activeObjectives[0].value;
      console.log("[SimplifiedUnifiedCreator] Sélection automatique du premier objectif:", firstObjective);
      setSelectedObjective(firstObjective);
    }
  }, [children, activeObjectives, selectedObjective, selectedChildIds]);

  // Gestionnaires d'événements simplifiés
  const toggleChildSelection = (childId: string) => {
    console.log("[SimplifiedUnifiedCreator] Basculement de la sélection pour l'enfant:", childId);
    
    setSelectedChildIds(prev => {
      const isSelected = prev.includes(childId);
      if (isSelected) {
        return prev.filter(id => id !== childId);
      } else {
        return [...prev, childId];
      }
    });
  };
  
  const handleObjectiveChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("[SimplifiedUnifiedCreator] Changement d'objectif:", event.target.value);
    setSelectedObjective(event.target.value);
  };
  
  const handleOpenCreateChildForm = () => {
    console.log("[SimplifiedUnifiedCreator] Ouverture du formulaire de création d'enfant");
    toast({
      title: "Fonctionnalité à venir",
      description: "La création d'enfant directement depuis cette vue sera implémentée prochainement.",
    });
  };
  
  // Soumission du formulaire avec bypass de validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[SimplifiedUnifiedCreator] Tentative de soumission avec:", {
      selectedChildIds,
      selectedObjective
    });
    
    // Empêcher les soumissions multiples
    if (isSubmitting) {
      console.log("[SimplifiedUnifiedCreator] Soumission déjà en cours, ignorée");
      return;
    }
    
    // Validation minimale
    let validIds = selectedChildIds;
    let validObjective = selectedObjective;
    
    // Correction automatique: si aucun enfant n'est sélectionné, prendre le premier
    if (!validIds || validIds.length === 0) {
      if (children && children.length > 0) {
        validIds = [children[0].id];
        console.log("[SimplifiedUnifiedCreator] Correction automatique: sélection du premier enfant:", validIds);
      } else {
        setError("Aucun enfant disponible. Veuillez d'abord créer un profil enfant.");
        return;
      }
    }
    
    // Correction automatique: si aucun objectif n'est sélectionné, prendre le premier
    if (!validObjective && activeObjectives && activeObjectives.length > 0) {
      validObjective = activeObjectives[0].value;
      console.log("[SimplifiedUnifiedCreator] Correction automatique: sélection du premier objectif:", validObjective);
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log("[SimplifiedUnifiedCreator] Soumission du formulaire avec données corrigées:", {
        childrenIds: validIds,
        objective: validObjective
      });
      
      // Notification à l'utilisateur
      toast({
        title: "Création en cours",
        description: "Nous préparons votre histoire personnalisée...",
      });
      
      // Appel à l'API de création
      const storyId = await onSubmit({
        childrenIds: validIds,
        objective: validObjective
      });
      
      console.log("[SimplifiedUnifiedCreator] Histoire créée avec succès, ID:", storyId);
      
      // Notifier du succès
      toast({
        title: "Histoire créée",
        description: "Votre histoire est en cours de génération et sera bientôt disponible.",
      });
      
      // Informer le parent du succès
      if (storyId) {
        // Créer une histoire temporaire pendant la génération
        const tempStory: Story = {
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: validIds,
          createdAt: new Date(),
          status: 'pending',
          content: "", // CORRECTION: utiliser 'content' au lieu de 'story_text'
          story_summary: "",
          objective: validObjective
        };
        
        onStoryCreated(tempStory);
      }
      
      // Réinitialiser le formulaire après succès
      setSelectedChildIds([]);
      setSelectedObjective("");
      
    } catch (error: any) {
      console.error("[SimplifiedUnifiedCreator] Erreur lors de la soumission:", error);
      setError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
      
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la création de l'histoire",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // États de chargement
  if (loadingObjectives) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Chargement des objectifs...</p>
      </div>
    );
  }
  
  // Style pour les cases à cocher
  const checkboxStyle = "h-5 w-5 rounded border-gray-300 focus:ring-2 focus:ring-primary";
  
  return (
    <div className="w-full max-w-3xl mx-auto bg-white dark:bg-slate-900 shadow-lg rounded-lg p-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-center mb-6 text-primary">Créer une histoire personnalisée</h2>
      
      {error && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 mb-6 rounded">
          <p className="text-destructive">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sélection des enfants - version simplifiée et directe */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Pour qui est cette histoire ?</h3>
          
          {children && children.length > 0 ? (
            <div className="space-y-2 border border-slate-200 dark:border-slate-700 rounded-md p-4">
              {children.map((child) => (
                <div
                  key={child.id}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer ${
                    selectedChildIds.includes(child.id) 
                      ? "bg-primary/10" 
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                  onClick={() => toggleChildSelection(child.id)}
                  data-child-id={child.id}
                  data-selected={selectedChildIds.includes(child.id) ? "true" : "false"}
                >
                  <input
                    type="checkbox"
                    className={checkboxStyle}
                    checked={selectedChildIds.includes(child.id)}
                    onChange={() => {}} // Géré par onClick du parent
                    id={`child-${child.id}`}
                  />
                  <label
                    htmlFor={`child-${child.id}`}
                    className="flex-grow cursor-pointer"
                  >
                    {child.name}
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-slate-100 dark:bg-slate-800 rounded-md">
              <p className="text-muted-foreground">Aucun profil enfant disponible</p>
            </div>
          )}
          
          <Button 
            type="button"
            variant="outline"
            className="w-full" 
            onClick={handleOpenCreateChildForm}
          >
            Ajouter un profil enfant
          </Button>
        </div>
        
        {/* Sélection de l'objectif - version simplifiée avec select standard */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Quel est l'objectif de cette histoire ?</h3>
          
          <select
            value={selectedObjective}
            onChange={handleObjectiveChange}
            className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900"
            data-objective-selector="true"
          >
            <option value="">Sélectionnez un objectif</option>
            {activeObjectives.map((objective) => (
              <option key={objective.id} value={objective.value}>
                {objective.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Bouton de soumission */}
        <Button
          type="submit"
          className="w-full py-6 text-lg font-semibold"
          disabled={isSubmitting}
          data-submit-button="true"
          data-submitting={isSubmitting ? "true" : "false"}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Générer l'histoire
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default SimplifiedUnifiedCreator;

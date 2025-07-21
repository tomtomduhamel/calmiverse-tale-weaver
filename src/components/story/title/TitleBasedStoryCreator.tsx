import React, { useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useN8nTitleGeneration } from "@/hooks/stories/useN8nTitleGeneration";
import { useN8nStoryFromTitle } from "@/hooks/stories/useN8nStoryFromTitle";
import { useStoryCreationMonitor } from "@/hooks/stories/useStoryCreationMonitor";
import { useSupabaseStories } from "@/hooks/stories/useSupabaseStories";
import { useToast } from "@/hooks/use-toast";
import TitleSelector from "./TitleSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";
import type { Child } from "@/types/child";
import type { GeneratedTitle } from "@/hooks/stories/useN8nTitleGeneration";

interface TitleBasedStoryCreatorProps {
  children: Child[];
  onStoryCreated: (storyId: string) => void;
}

const TitleBasedStoryCreator: React.FC<TitleBasedStoryCreatorProps> = ({
  children,
  onStoryCreated,
}) => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { stories } = useSupabaseStories();
  
  // États du processus
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [selectedTitle, setSelectedTitle] = useState<GeneratedTitle | null>(null);
  const [currentStep, setCurrentStep] = useState<"form" | "titles" | "creating">("form");

  // Hooks pour la génération et création
  const { generateTitles, generatedTitles, isGeneratingTitles } = useN8nTitleGeneration();
  const { createStoryFromTitle, isCreatingStory } = useN8nStoryFromTitle();
  
  // Hook de surveillance pour attendre la création effective
  const { isMonitoring, startMonitoring } = useStoryCreationMonitor({
    onStoryCreated: (storyId: string) => {
      console.log('[TitleBasedStoryCreator] Histoire créée avec succès:', storyId);
      onStoryCreated(storyId);
    },
    onTimeout: () => {
      console.warn('[TitleBasedStoryCreator] Timeout - redirection vers bibliothèque');
      onStoryCreated("timeout"); // Signal pour rediriger vers la bibliothèque
    }
  });

  // Objectifs possibles
  const objectives = [
    { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
    { id: "focus", label: "Se concentrer", value: "focus" },
    { id: "relax", label: "Se relaxer", value: "relax" },
    { id: "fun", label: "S'amuser", value: "fun" },
  ];

  // Validation du formulaire
  const validateForm = () => {
    if (selectedChildrenIds.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un enfant",
        variant: "destructive",
      });
      return false;
    }
    if (!selectedObjective) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un objectif",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Fonctions de gestion des changements
  const handleObjectiveChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedObjective(e.target.value);
  };

  const handleChildToggle = (childId: string) => {
    setSelectedChildrenIds((prevIds) =>
      prevIds.includes(childId)
        ? prevIds.filter((id) => id !== childId)
        : [...prevIds, childId]
    );
  };

  const handleGenerateTitles = async () => {
    if (!validateForm()) return;

    try {
      const selectedChildren = children.filter(child => 
        selectedChildrenIds.includes(child.id)
      );
      
      await generateTitles({
        objective: selectedObjective,
        childrenNames: selectedChildren.map(child => child.name)
      });
      
      setCurrentStep("titles");
    } catch (error: any) {
      console.error("Erreur génération titres:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les titres. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleTitleSelected = async (title: GeneratedTitle) => {
    if (!validateForm()) return;

    setSelectedTitle(title);
    setCurrentStep("creating");

    try {
      const selectedChildren = children.filter(child => 
        selectedChildrenIds.includes(child.id)
      );

      console.log('[TitleBasedStoryCreator] Démarrage création avec titre:', title.title);
      
      // Compter les histoires actuelles pour surveiller les nouvelles
      const currentStoryCount = stories.length;
      
      // Lancer le processus de création via n8n
      const processId = await createStoryFromTitle({
        selectedTitle: title.title,
        objective: selectedObjective,
        childrenIds: selectedChildrenIds,
        childrenNames: selectedChildren.map(child => child.name)
      });

      console.log('[TitleBasedStoryCreator] Processus n8n lancé:', processId);
      console.log('[TitleBasedStoryCreator] Démarrage surveillance avec', currentStoryCount, 'histoires');
      
      // Démarrer la surveillance pour attendre que l'histoire apparaisse en base
      startMonitoring(currentStoryCount);
      
    } catch (error: any) {
      console.error("Erreur création histoire:", error);
      setCurrentStep("titles"); // Retour à la sélection de titre
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'histoire",
        variant: "destructive",
      });
    }
  };

  // Rendu du formulaire de sélection
  const renderForm = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Paramètres de l'histoire</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sélection des enfants */}
        <div className="grid gap-2">
          <h3 className="text-sm font-medium leading-none">
            Pour qui écrivez-vous cette histoire ?
          </h3>
          <div className="flex flex-wrap gap-2">
            {children.map((child) => (
              <Button
                key={child.id}
                variant={
                  selectedChildrenIds.includes(child.id) ? "secondary" : "outline"
                }
                onClick={() => handleChildToggle(child.id)}
              >
                {child.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Sélection de l'objectif */}
        <div className="grid gap-2">
          <h3 className="text-sm font-medium leading-none">
            Quel est l'objectif de cette histoire ?
          </h3>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedObjective}
            onChange={handleObjectiveChange}
          >
            <option value="">Sélectionnez un objectif</option>
            {objectives.map((objective) => (
              <option key={objective.id} value={objective.value}>
                {objective.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bouton de génération des titres */}
        <Button onClick={handleGenerateTitles} disabled={isGeneratingTitles}>
          {isGeneratingTitles ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Génération des titres...
            </>
          ) : (
            "Générer des titres"
          )}
        </Button>
      </CardContent>
    </Card>
  );

  // Rendu de la sélection des titres
  const renderTitleSelection = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <Button variant="ghost" onClick={() => setCurrentStep("form")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <CardTitle>Sélectionnez un titre</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGeneratingTitles ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Génération des titres en cours...</p>
          </div>
        ) : (
          <TitleSelector
            titles={generatedTitles}
            onTitleSelected={handleTitleSelected}
          />
        )}
      </CardContent>
    </Card>
  );

  // Rendu de l'état de création
  if (currentStep === "creating") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 animate-pulse text-primary" />
            Création de votre histoire en cours
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium">
              "{selectedTitle?.title}"
            </p>
            <p className="text-muted-foreground">
              {isCreatingStory && "Envoi vers n8n en cours..."}
              {isMonitoring && "Génération de l'histoire par l'IA..."}
            </p>
            <p className="text-sm text-muted-foreground">
              Cette opération peut prendre quelques minutes. Votre histoire apparaîtra automatiquement dans votre bibliothèque une fois terminée.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return currentStep === "titles" ? renderTitleSelection() : renderForm();
};

export default TitleBasedStoryCreator;
